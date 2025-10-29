import { z } from 'zod';
import Note from '../models/Note.js';

const createSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1)
});

export async function createNote(req, res) {
  try {
    const { title = '', content } = createSchema.parse(req.body);
    const note = await Note.create({ owner: req.user.id, title, content });
    res.status(201).json(note);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Could not create note' });
  }
}

export async function listNotes(req, res) {
  const notes = await Note.find({ owner: req.user.id }).sort({ updatedAt: -1 });
  res.json(notes);
}

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1).optional()
});

export async function updateNote(req, res) {
  try {
    const updates = updateSchema.parse(req.body);
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    res.status(500).json({ error: 'Could not update note' });
  }
}

export async function deleteNote(req, res) {
  const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json({ message: 'Deleted' });
}
