import { prisma } from "@buievo/db";
import type { 
  CampaignServiceResponse, 
  SingleCampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignAnalytics,
  CampaignStats
} from "@buievo/types";

export class CampaignService {
  /**
   * Get campaigns with pagination and filtering
   */
  async getCampaigns(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<CampaignServiceResponse> {
    const skip = (page - 1) * limit;
    
    // Build where clause based on filters
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Get campaigns with template and segments
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        template: true,
        targetSegments: true,
        _count: {
          select: {
            targetSegments: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.campaign.count({ where });

    return {
      data: campaigns as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        targetSegments: true,
        _count: {
          select: {
            targetSegments: true,
          },
        },
      },
    });

    return { campaign };
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignRequest): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        templateId: data.templateId,
        status: 'draft',
        scheduledAt: data.scheduledAt,
        targetSegments: {
          connect: data.targetSegmentIds.map(id => ({ id })),
        },
      },
      include: {
        template: true,
        targetSegments: true,
      },
    });

    return { campaign };
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        templateId: data.templateId,
        status: data.status,
        scheduledAt: data.scheduledAt,
        targetSegments: data.targetSegmentIds ? {
          set: data.targetSegmentIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        template: true,
        targetSegments: true,
      },
    });

    return { campaign };
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<boolean> {
    try {
      await prisma.campaign.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
      },
    });

    if (!campaign) {
      return null;
    }

    // Calculate analytics
    const totalContacts = campaign.targetSegments.reduce(
      (total, segment) => total + segment.contacts.length,
      0
    );

    return {
      campaignId: campaign.id,
      totalContacts,
      sentMessages: campaign.sentCount,
      deliveredMessages: campaign.deliveredCount,
      failedMessages: campaign.failedCount,
      openRate: totalContacts > 0 ? (campaign.readCount / totalContacts) * 100 : 0,
      clickRate: totalContacts > 0 ? (campaign.clickedCount / totalContacts) * 100 : 0,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<CampaignStats> {
    const [total, draft, active, paused, completed, cancelled] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'draft' } }),
      prisma.campaign.count({ where: { status: 'sending' } }),
      prisma.campaign.count({ where: { status: 'scheduled' } }),
      prisma.campaign.count({ where: { status: 'completed' } }),
      prisma.campaign.count({ where: { status: 'failed' } }),
    ]);

    return {
      total,
      draft,
      active,
      paused,
      completed,
      cancelled,
    };
  }

  /**
   * Start a campaign
   */
  async startCampaign(id: string): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'sending',
      },
      include: {
        template: true,
        targetSegments: true,
      },
    });

    return { campaign };
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(id: string): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'paused',
      },
      include: {
        template: true,
        targetSegments: true,
      },
    });

    return { campaign };
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(id: string): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'completed',
      },
      include: {
        template: true,
        targetSegments: true,
      },
    });

    return { campaign };
  }

  /**
   * Update campaign metrics
   */
  async updateCampaignMetrics(
    id: string,
    metrics: {
      sentCount?: number;
      deliveredCount?: number;
      failedCount?: number;
      readCount?: number;
      clickedCount?: number;
    }
  ): Promise<{ campaign: any }> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: metrics,
      include: {
        template: true,
        targetSegments: true,
      },
    });

    return { campaign };
  }
}

export const campaignService = new CampaignService();
