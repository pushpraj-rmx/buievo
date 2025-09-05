import { ContactRepository } from '../repositories/contact.repository';
import { Contact, CreateContactData, UpdateContactData, ContactSearchParams, PaginationOptions } from '../types/contact.types';

export class ContactService {
  private contactRepository: ContactRepository;

  constructor() {
    this.contactRepository = new ContactRepository();
  }

  async getAllContacts(pagination: PaginationOptions): Promise<{ contacts: Contact[]; total: number; page: number; totalPages: number }> {
    try {
      const { contacts, total } = await this.contactRepository.findAll(pagination);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        contacts,
        total,
        page: pagination.page,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to fetch contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContactById(id: string): Promise<Contact | null> {
    try {
      return await this.contactRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createContact(contactData: CreateContactData): Promise<Contact> {
    try {
      // Check if contact with same email already exists
      const existingContact = await this.contactRepository.findByEmail(contactData.email);
      if (existingContact) {
        throw new Error('Contact with this email already exists');
      }

      return await this.contactRepository.create(contactData);
    } catch (error) {
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateContact(id: string, updateData: UpdateContactData): Promise<Contact | null> {
    try {
      // Check if contact exists
      const existingContact = await this.contactRepository.findById(id);
      if (!existingContact) {
        return null;
      }

      // If email is being updated, check for duplicates
      if (updateData.email && updateData.email !== existingContact.email) {
        const duplicateContact = await this.contactRepository.findByEmail(updateData.email);
        if (duplicateContact) {
          throw new Error('Contact with this email already exists');
        }
      }

      return await this.contactRepository.update(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    try {
      return await this.contactRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchContacts(searchParams: ContactSearchParams): Promise<{ contacts: Contact[]; total: number; page: number; totalPages: number }> {
    try {
      const { contacts, total } = await this.contactRepository.search(searchParams);
      const totalPages = Math.ceil(total / searchParams.limit);
      
      return {
        contacts,
        total,
        page: searchParams.page,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to search contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContactsByCategory(category: string, pagination: PaginationOptions): Promise<{ contacts: Contact[]; total: number; page: number; totalPages: number }> {
    try {
      const { contacts, total } = await this.contactRepository.findByCategory(category, pagination);
      const totalPages = Math.ceil(total / pagination.limit);
      
      return {
        contacts,
        total,
        page: pagination.page,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to fetch contacts by category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async bulkOperation(operation: string, contactIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const result = { success: 0, failed: 0, errors: [] as string[] };

      switch (operation) {
        case 'delete':
          for (const id of contactIds) {
            try {
              const deleted = await this.contactRepository.delete(id);
              if (deleted) {
                result.success++;
              } else {
                result.failed++;
                result.errors.push(`Contact ${id} not found`);
              }
            } catch (error) {
              result.failed++;
              result.errors.push(`Failed to delete contact ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          break;

        case 'update_category':
          // This would require additional data for the new category
          throw new Error('Bulk category update not implemented yet');

        default:
          throw new Error(`Unsupported bulk operation: ${operation}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to perform bulk operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContactStats(): Promise<{ total: number; byCategory: Record<string, number>; byStatus: Record<string, number> }> {
    try {
      const stats = await this.contactRepository.getStats();
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch contact stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

