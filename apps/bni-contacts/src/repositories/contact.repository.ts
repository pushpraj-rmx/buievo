import { Contact, CreateContactData, UpdateContactData, ContactSearchParams, PaginationOptions } from '../types/contact.types';

export class ContactRepository {
  // This is a mock implementation. In a real application, you would connect to your database
  private contacts: Contact[] = [];
  private nextId = 1;

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    this.contacts = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'BNI Chapter A',
        position: 'Member',
        category: 'member',
        tags: ['networking', 'business'],
        status: 'active',
        notes: 'Active BNI member since 2020',
        createdAt: new Date('2020-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        company: 'BNI Chapter B',
        position: 'President',
        category: 'leadership',
        tags: ['leadership', 'networking'],
        status: 'active',
        notes: 'Chapter President',
        createdAt: new Date('2019-06-20'),
        updatedAt: new Date('2024-01-15'),
      },
    ];
    this.nextId = 3;
  }

  async findAll(pagination: PaginationOptions): Promise<{ contacts: Contact[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = pagination;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Sort contacts
    const sortedContacts = [...this.contacts].sort((a, b) => {
      const aValue = a[sortBy as keyof Contact];
      const bValue = b[sortBy as keyof Contact];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });

    const paginatedContacts = sortedContacts.slice(startIndex, endIndex);
    
    return {
      contacts: paginatedContacts,
      total: this.contacts.length,
    };
  }

  async findById(id: string): Promise<Contact | null> {
    return this.contacts.find(contact => contact.id === id) || null;
  }

  async findByEmail(email: string): Promise<Contact | null> {
    return this.contacts.find(contact => contact.email === email) || null;
  }

  async create(contactData: CreateContactData): Promise<Contact> {
    const newContact: Contact = {
      id: this.nextId.toString(),
      ...contactData,
      tags: contactData.tags || [],
      status: contactData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contacts.push(newContact);
    this.nextId++;

    return newContact;
  }

  async update(id: string, updateData: UpdateContactData): Promise<Contact | null> {
    const contactIndex = this.contacts.findIndex(contact => contact.id === id);
    
    if (contactIndex === -1) {
      return null;
    }

    const updatedContact: Contact = {
      ...this.contacts[contactIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    this.contacts[contactIndex] = updatedContact;
    return updatedContact;
  }

  async delete(id: string): Promise<boolean> {
    const contactIndex = this.contacts.findIndex(contact => contact.id === id);
    
    if (contactIndex === -1) {
      return false;
    }

    this.contacts.splice(contactIndex, 1);
    return true;
  }

  async search(searchParams: ContactSearchParams): Promise<{ contacts: Contact[]; total: number }> {
    const { query, category, tags, page, limit } = searchParams;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    let filteredContacts = this.contacts;

    // Filter by query (search in name, email, company)
    if (query) {
      const queryLower = query.toLowerCase();
      filteredContacts = filteredContacts.filter(contact =>
        contact.firstName.toLowerCase().includes(queryLower) ||
        contact.lastName.toLowerCase().includes(queryLower) ||
        contact.email.toLowerCase().includes(queryLower) ||
        (contact.company?.toLowerCase().includes(queryLower) || false)
      );
    }

    // Filter by category
    if (category) {
      filteredContacts = filteredContacts.filter(contact => contact.category === category);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      filteredContacts = filteredContacts.filter(contact =>
        tags.some(tag => contact.tags.includes(tag))
      );
    }

    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);
    
    return {
      contacts: paginatedContacts,
      total: filteredContacts.length,
    };
  }

  async findByCategory(category: string, pagination: PaginationOptions): Promise<{ contacts: Contact[]; total: number }> {
    const { page, limit } = pagination;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const categoryContacts = this.contacts.filter(contact => contact.category === category);
    const paginatedContacts = categoryContacts.slice(startIndex, endIndex);
    
    return {
      contacts: paginatedContacts,
      total: categoryContacts.length,
    };
  }

  async getStats(): Promise<{ total: number; byCategory: Record<string, number>; byStatus: Record<string, number> }> {
    const stats = {
      total: this.contacts.length,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    // Count by category
    this.contacts.forEach(contact => {
      stats.byCategory[contact.category] = (stats.byCategory[contact.category] || 0) + 1;
      stats.byStatus[contact.status] = (stats.byStatus[contact.status] || 0) + 1;
    });

    return stats;
  }
}

