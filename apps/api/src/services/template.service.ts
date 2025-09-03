import { prisma } from "@buievo/db";
import type { 
  TemplateServiceResponse, 
  SingleTemplateResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest
} from "@buievo/types";

export class TemplateService {
  /**
   * Get templates with pagination and filtering
   */
  async getTemplates(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string
  ): Promise<TemplateServiceResponse> {
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

    // Get templates
    const templates = await prisma.template.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.template.count({ where });

    return {
      data: templates as any,
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
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<{ template: any }> {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    return { template };
  }

  /**
   * Create a new template
   */
  async createTemplate(data: CreateTemplateRequest): Promise<{ template: any }> {
    const template = await prisma.template.create({
      data: {
        name: data.name,
        content: data.content,
        status: 'pending',
      },
    });

    return { template };
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<{ template: any }> {
    const template = await prisma.template.update({
      where: { id },
      data: {
        name: data.name,
        content: data.content,
        status: data.status,
      },
    });

    return { template };
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await prisma.template.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get templates by status
   */
  async getTemplatesByStatus(status: string, page: number = 1, limit: number = 20): Promise<TemplateServiceResponse> {
    const skip = (page - 1) * limit;

    const templates = await prisma.template.findMany({
      where: { status },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.template.count({
      where: { status },
    });

    return {
      data: templates as any,
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
   * Search templates
   */
  async searchTemplates(query: string, page: number = 1, limit: number = 20): Promise<TemplateServiceResponse> {
    const skip = (page - 1) * limit;

    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.template.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      data: templates as any,
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
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.template.count(),
      prisma.template.count({ where: { status: 'pending' } }),
      prisma.template.count({ where: { status: 'approved' } }),
      prisma.template.count({ where: { status: 'rejected' } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }

  /**
   * Approve a template
   */
  async approveTemplate(id: string): Promise<{ template: any }> {
    const template = await prisma.template.update({
      where: { id },
      data: {
        status: 'approved',
      },
    });

    return { template };
  }

  /**
   * Reject a template
   */
  async rejectTemplate(id: string): Promise<{ template: any }> {
    const template = await prisma.template.update({
      where: { id },
      data: {
        status: 'rejected',
      },
    });

    return { template };
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string, newName: string): Promise<{ template: any }> {
    const originalTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    const template = await prisma.template.create({
      data: {
        name: newName,
        content: originalTemplate.content as any,
        status: 'pending',
      },
    });

    return { template };
  }

  /**
   * Get templates used in campaigns
   */
  async getTemplatesWithCampaigns(page: number = 1, limit: number = 20): Promise<TemplateServiceResponse> {
    const skip = (page - 1) * limit;

    const templates = await prisma.template.findMany({
      include: {
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.template.count();

    return {
      data: templates as any,
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
   * Validate template content
   */
  async validateTemplateContent(content: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic validation
    if (!content) {
      errors.push('Template content is required');
    }

    if (typeof content !== 'object') {
      errors.push('Template content must be an object');
    }

    // Add more validation logic as needed
    // This could include checking for required WhatsApp template fields
    // like name, language, category, components, etc.

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const templateService = new TemplateService();
