import { Request, Response } from "express";
import { prisma } from "@whatssuite/db";
import { redis } from "@whatssuite/redis";

// Get all campaigns with pagination and filtering
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Get campaigns with related data
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        targetSegments: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                contacts: true
              }
            }
          }
        },
        _count: {
          select: {
            targetSegments: true
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const total = await prisma.campaign.count({ where });

    res.json({
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single campaign by ID
export const getCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        targetSegments: {
          include: {
            contacts: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new campaign
export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      templateId, 
      segmentIds, 
      scheduledAt,
      status = 'draft'
    } = req.body;

    if (!name || !templateId) {
      return res.status(400).json({ message: "Name and template are required" });
    }

    // Verify template exists and is approved
    const template = await prisma.template.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(400).json({ message: "Template not found" });
    }

    if (template.status !== 'APPROVED') {
      return res.status(400).json({ message: "Template must be approved to use in campaigns" });
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        templateId,
        targetSegments: segmentIds ? {
          connect: segmentIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        targetSegments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a campaign
export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      templateId, 
      segmentIds, 
      scheduledAt,
      status 
    } = req.body;

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Don't allow updates if campaign is already sending or completed
    if (existingCampaign.status === 'sending' || existingCampaign.status === 'completed') {
      return res.status(400).json({ message: "Cannot update campaign that is already sending or completed" });
    }

    // Verify template if being changed
    if (templateId) {
      const template = await prisma.template.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return res.status(400).json({ message: "Template not found" });
      }

      if (template.status !== 'APPROVED') {
        return res.status(400).json({ message: "Template must be approved to use in campaigns" });
      }
    }

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        templateId,
        targetSegments: segmentIds ? {
          set: [], // Clear existing segments
          connect: segmentIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        targetSegments: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a campaign
export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Don't allow deletion if campaign is sending
    if (campaign.status === 'sending') {
      return res.status(400).json({ message: "Cannot delete campaign that is currently sending" });
    }

    await prisma.campaign.delete({
      where: { id }
    });

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Start a campaign
export const startCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        targetSegments: {
          include: {
            contacts: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ message: "Campaign can only be started from draft or scheduled status" });
    }

    if (campaign.targetSegments.length === 0) {
      return res.status(400).json({ message: "Campaign must have at least one target segment" });
    }

    // Get all contacts from target segments
    const allContacts = campaign.targetSegments.flatMap(segment => segment.contacts);
    const uniqueContacts = allContacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.id === contact.id)
    );

    if (uniqueContacts.length === 0) {
      return res.status(400).json({ message: "No contacts found in target segments" });
    }

    // Update campaign status to sending
    await prisma.campaign.update({
      where: { id },
      data: { status: 'sending' }
    });

    // Queue messages for each contact
    const jobPayload = {
      campaignId: id,
      templateName: campaign.template.name,
      contacts: uniqueContacts.map(contact => ({
        id: contact.id,
        phone: contact.phone
      }))
    };

    // Publish the job to the Redis queue
    await redis.publish("campaign-queue", JSON.stringify(jobPayload));

    res.json({ 
      message: "Campaign started successfully",
      totalContacts: uniqueContacts.length
    });
  } catch (error) {
    console.error("Error starting campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Pause a campaign
export const pauseCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== 'sending') {
      return res.status(400).json({ message: "Only sending campaigns can be paused" });
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'paused' }
    });

    res.json({ message: "Campaign paused successfully" });
  } catch (error) {
    console.error("Error pausing campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Resume a campaign
export const resumeCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({ message: "Only paused campaigns can be resumed" });
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'sending' }
    });

    res.json({ message: "Campaign resumed successfully" });
  } catch (error) {
    console.error("Error resuming campaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get campaign analytics
export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        targetSegments: {
          include: {
            _count: {
              select: {
                contacts: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Calculate total target contacts
    const totalTargetContacts = campaign.targetSegments.reduce(
      (total, segment) => total + segment._count.contacts, 
      0
    );

    // Calculate delivery rate
    const deliveryRate = totalTargetContacts > 0 
      ? (campaign.deliveredCount / totalTargetContacts) * 100 
      : 0;

    // Calculate read rate
    const readRate = campaign.deliveredCount > 0 
      ? (campaign.readCount / campaign.deliveredCount) * 100 
      : 0;

    // Calculate click rate
    const clickRate = campaign.deliveredCount > 0 
      ? (campaign.clickedCount / campaign.deliveredCount) * 100 
      : 0;

    const analytics = {
      campaign,
      totalTargetContacts,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      readRate: Math.round(readRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      failureRate: totalTargetContacts > 0 
        ? Math.round(((campaign.failedCount / totalTargetContacts) * 100) * 100) / 100 
        : 0
    };

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get campaign statistics
export const getCampaignStats = async (req: Request, res: Response) => {
  try {
    const stats = await prisma.campaign.aggregate({
      _count: {
        id: true
      },
      _sum: {
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        readCount: true,
        clickedCount: true
      }
    });

    const statusCounts = await prisma.campaign.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusBreakdown = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalCampaigns: stats._count.id,
      totalSent: stats._sum.sentCount || 0,
      totalDelivered: stats._sum.deliveredCount || 0,
      totalFailed: stats._sum.failedCount || 0,
      totalRead: stats._sum.readCount || 0,
      totalClicked: stats._sum.clickedCount || 0,
      statusBreakdown
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



