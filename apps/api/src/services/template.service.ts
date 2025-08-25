import { prisma } from "@whatssuite/db";

export class TemplateService {
  /**
   * Get templates with pagination and filtering
   */
  async getTemplates(
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
      data: templates,
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
  async getTemplateById(id: string): Promise<any | null> {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    return template;
  }

  /**
   * Create a new template
   */
  async createTemplate(data: {
    name: string;
    content: any;
  }): Promise<any> {
    const template = await prisma.template.create({
      data: {
        name: data.name,
        content: data.content,
        status: 'PENDING',
      },
    });

    return template;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, data: {
    name?: string;
    content?: any;
    status?: string;
  }): Promise<any> {
    const template = await prisma.template.update({
      where: { id },
      data: {
        name: data.name,
        content: data.content,
        status: data.status,
      },
    });

    return template;
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
   * Sync templates with WhatsApp Business API
   */
  async syncTemplates(): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // Mock template data - in real implementation, this would call WhatsApp API
      const mockTemplates = {
        data: [
          {
            name: "welcome_message",
            status: "APPROVED",
            content: {
              components: [
                {
                  type: "HEADER",
                  format: "TEXT",
                  text: "Welcome to our service!",
                },
                {
                  type: "BODY",
                  text: "Hello {{1}}, welcome to our platform! We're excited to have you on board.",
                },
              ],
            },
          },
          {
            name: "order_confirmation",
            status: "APPROVED",
            content: {
              components: [
                {
                  type: "HEADER",
                  format: "TEXT",
                  text: "Order Confirmation",
                },
                {
                  type: "BODY",
                  text: "Hi {{1}}, your order #{{2}} has been confirmed and will be shipped on {{3}}.",
                },
              ],
            },
          },
        ],
      };

      // Process each template
      for (const templateData of mockTemplates.data) {
        try {
          // Check if template already exists
          const existingTemplate = await prisma.template.findFirst({
            where: { name: templateData.name },
          });

          if (existingTemplate) {
            // Update existing template
            await prisma.template.update({
              where: { id: existingTemplate.id },
              data: {
                status: templateData.status,
                content: templateData.content,
              },
            });
          } else {
            // Create new template
            await prisma.template.create({
              data: {
                name: templateData.name,
                content: templateData.content,
                status: templateData.status,
              },
            });
          }
          count++;
        } catch (error) {
          errors.push(`Failed to sync template ${templateData.name}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        count,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to sync templates: ${error}`);
      return {
        success: false,
        count: 0,
        errors,
      };
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  }> {
    const templates = await prisma.template.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const stats: Record<string, number> = {};
    templates.forEach((template) => {
      stats[template.status] = template._count.id;
    });

    return {
      total: Object.values(stats).reduce((sum, count) => sum + count, 0),
      approved: stats['APPROVED'] || 0,
      pending: stats['PENDING'] || 0,
      rejected: stats['REJECTED'] || 0,
    };
  }

  /**
   * Get approved templates only
   */
  async getApprovedTemplates(): Promise<any[]> {
    const templates = await prisma.template.findMany({
      where: { status: 'APPROVED' },
      orderBy: {
        name: 'asc',
      },
    });

    return templates;
  }

  /**
   * Validate template content
   */
  async validateTemplate(content: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Basic validation
      if (!content || typeof content !== 'object') {
        errors.push('Template content must be an object');
        return { valid: false, errors };
      }

      // Check for required components
      if (!Array.isArray(content.components)) {
        errors.push('Template must have components array');
        return { valid: false, errors };
      }

      // Validate each component
      content.components.forEach((component: any, index: number) => {
        if (!component.type) {
          errors.push(`Component ${index + 1} must have a type`);
        }

        if (component.type === 'HEADER' && !component.text) {
          errors.push(`Header component ${index + 1} must have text`);
        }

        if (component.type === 'BODY' && !component.text) {
          errors.push(`Body component ${index + 1} must have text`);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Validation error: ${error}`);
      return { valid: false, errors };
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService();
