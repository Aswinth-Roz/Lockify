import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: '' },
  content: { type: String, required: true }, // store ciphertext from client
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);
