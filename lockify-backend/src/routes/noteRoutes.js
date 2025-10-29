import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createNote, listNotes, updateNote, deleteNote } from '../controllers/noteController.js';

const router = Router();

router.use(requireAuth);

// Match frontend routes exactly
router.get('/get', listNotes);
router.post('/save', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
