import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import { ContactValidation } from '../validation/contact.validation';

export class ContactController {
  private contactService: ContactService;
  private contactValidation: ContactValidation;

  constructor() {
    this.contactService = new ContactService();
    this.contactValidation = new ContactValidation();
  }

  async getAllContacts(req: Request, res: Response) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pagination = {
      page: Number(page),
      limit: Number(limit),
      sortBy: String(sortBy),
      sortOrder: String(sortOrder) as 'asc' | 'desc'
    };

    const contacts = await this.contactService.getAllContacts(pagination);
    
    return {
      success: true,
      data: contacts,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
        pagination,
      },
    };
  }

  async getContactById(req: Request, res: Response) {
    const { id } = req.params;
    
    // Validate ID
    const validationResult = this.contactValidation.validateId(id);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid contact ID',
          details: validationResult.errors,
          statusCode: 400,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const contact = await this.contactService.getContactById(id);
    
    if (!contact) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Contact not found',
          statusCode: 404,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    return {
      success: true,
      data: contact,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async createContact(req: Request, res: Response) {
    const contactData = req.body;
    
    // Validate contact data
    const validationResult = this.contactValidation.validateCreateContact(contactData);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid contact data',
          details: validationResult.errors,
          statusCode: 400,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const contact = await this.contactService.createContact(contactData);
    
    return {
      success: true,
      data: contact,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async updateContact(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate ID and update data
    const idValidation = this.contactValidation.validateId(id);
    const dataValidation = this.contactValidation.validateUpdateContact(updateData);
    
    if (!idValidation.success || !dataValidation.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid data',
          details: {
            id: idValidation.errors,
            data: dataValidation.errors,
          },
          statusCode: 400,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const contact = await this.contactService.updateContact(id, updateData);
    
    if (!contact) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Contact not found',
          statusCode: 404,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    return {
      success: true,
      data: contact,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async deleteContact(req: Request, res: Response) {
    const { id } = req.params;
    
    // Validate ID
    const validationResult = this.contactValidation.validateId(id);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid contact ID',
          details: validationResult.errors,
          statusCode: 400,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const deleted = await this.contactService.deleteContact(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Contact not found',
          statusCode: 404,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    return {
      success: true,
      message: 'Contact deleted successfully',
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async searchContacts(req: Request, res: Response) {
    const { q, category, tags, page = 1, limit = 10 } = req.query;
    
    const searchParams = {
      query: String(q || ''),
      category: category ? String(category) : undefined,
      tags: tags ? String(tags).split(',') : undefined,
      page: Number(page),
      limit: Number(limit),
    };

    const contacts = await this.contactService.searchContacts(searchParams);
    
    return {
      success: true,
      data: contacts,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
        searchParams,
      },
    };
  }

  async getContactsByCategory(req: Request, res: Response) {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const pagination = {
      page: Number(page),
      limit: Number(limit),
    };

    const contacts = await this.contactService.getContactsByCategory(category, pagination);
    
    return {
      success: true,
      data: contacts,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
        category,
        pagination,
      },
    };
  }

  async bulkOperation(req: Request, res: Response) {
    const { operation, contacts } = req.body;
    
    // Validate bulk operation data
    const validationResult = this.contactValidation.validateBulkOperation({ operation, contacts });
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid bulk operation data',
          details: validationResult.errors,
          statusCode: 400,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const result = await this.contactService.bulkOperation(operation, contacts);
    
    return {
      success: true,
      data: result,
      meta: {
        requestId: (req as any).requestId,
        timestamp: new Date().toISOString(),
        operation,
      },
    };
  }
}

