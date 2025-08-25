import { prisma } from "@whatssuite/db";

export class CampaignService {
  /**
   * Get campaigns with pagination and filtering
   */
  async getCampaigns(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
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

    // Get campaigns with segments and template
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
        template: true,
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
      data: campaigns,
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
  async getCampaignById(id: string): Promise<any | null> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
        template: true,
      },
    });

    return campaign;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    name: string;
    templateId: string;
    targetSegmentIds: string[];
    scheduledAt?: Date;
  }): Promise<any> {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        status: 'draft',
        scheduledAt: data.scheduledAt,
        templateId: data.templateId,
        targetSegments: {
          connect: data.targetSegmentIds.map(id => ({ id }))
        },
      },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
        template: true,
      },
    });

    return campaign;
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, data: {
    name?: string;
    templateId?: string;
    targetSegmentIds?: string[];
    scheduledAt?: Date;
    status?: string;
  }): Promise<any> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status,
        scheduledAt: data.scheduledAt,
        templateId: data.templateId,
        targetSegments: data.targetSegmentIds ? {
          set: data.targetSegmentIds.map(segmentId => ({ id: segmentId }))
        } : undefined,
      },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
        template: true,
      },
    });

    return campaign;
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
   * Start a campaign
   */
  async startCampaign(id: string): Promise<any> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'sending',
        scheduledAt: new Date(), // Start immediately
      },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
        template: true,
      },
    });

    return campaign;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(id: string): Promise<any> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'draft',
      },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
        template: true,
      },
    });

    return campaign;
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<{
    total: number;
    draft: number;
    sending: number;
    completed: number;
    failed: number;
  }> {
    const campaigns = await prisma.campaign.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const stats: Record<string, number> = {};
    campaigns.forEach((campaign) => {
      stats[campaign.status] = campaign._count.id;
    });

    return {
      total: Object.values(stats).reduce((sum, count) => sum + count, 0),
      draft: stats['draft'] || 0,
      sending: stats['sending'] || 0,
      completed: stats['completed'] || 0,
      failed: stats['failed'] || 0,
    };
  }

  /**
   * Get all contacts for a campaign
   */
  async getCampaignContacts(id: string): Promise<any[]> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        targetSegments: {
          include: {
            contacts: true,
          },
        },
      },
    });

    if (!campaign) {
      return [];
    }

    // Flatten and deduplicate contacts from all segments
    const allContacts = campaign.targetSegments.flatMap(segment => segment.contacts);
    const uniqueContacts = allContacts.filter(
      (contact, index, self) => index === self.findIndex(c => c.id === contact.id)
    );

    return uniqueContacts;
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
