import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { ContactController } from '../controllers/contact.controller';

const router = Router();
const contactController = new ContactController();

// Get all contacts
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const contacts = await contactController.getAllContacts(req, res);
  res.json(contacts);
}));

// Get contact by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const contact = await contactController.getContactById(req, res);
  res.json(contact);
}));

// Create new contact
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const contact = await contactController.createContact(req, res);
  res.status(201).json(contact);
}));

// Update contact
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const contact = await contactController.updateContact(req, res);
  res.json(contact);
}));

// Delete contact
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await contactController.deleteContact(req, res);
  res.status(204).send();
}));

// Search contacts
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const contacts = await contactController.searchContacts(req, res);
  res.json(contacts);
}));

// Get contacts by category
router.get('/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const contacts = await contactController.getContactsByCategory(req, res);
  res.json(contacts);
}));

// Bulk operations
router.post('/bulk', asyncHandler(async (req: Request, res: Response) => {
  const result = await contactController.bulkOperation(req, res);
  res.json(result);
}));

export default router;

