import { Router } from 'express';
import { TransactionNotesController } from '../../controllers/transaction/transactionNotesController';
import { requireAuthWithUserId } from '../../middleware/auth';

const router = Router();

router.use(requireAuthWithUserId);

// Transaction notes
router.post('/:id/notes', TransactionNotesController.addNote);
router.get('/:id/notes', TransactionNotesController.getNote);
router.delete('/:id/notes', TransactionNotesController.deleteNote);

// User notes
router.get('/notes', TransactionNotesController.getUserNotes);

// Tags
router.post('/tags', TransactionNotesController.createTag);
router.get('/tags', TransactionNotesController.getUserTags);
router.delete('/tags/:id', TransactionNotesController.deleteTag);

export default router;

