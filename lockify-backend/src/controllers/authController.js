import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function signup(req, res) {
  try {
    const { fullName, email, password } = signupSchema.parse(req.body);
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, passwordHash });
    return res.status(201).json({ message: 'Signup successful. You can now log in.' });
  } catch (e) {
  console.log("SIGNUP ERROR:", e); // ✅ This prints the real error in the terminal

  if (e?.issues) {
    return res.status(400).json({ error: e.issues[0].message });
  }

  // If duplicate email
  if (e.code === 11000) {
    return res.status(400).json({ error: "Email already registered" });
  }

  return res.status(500).json({ error: e.message || "Signup failed" });
}

}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function login(req, res) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
    return res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
  } catch (e) {
    if (e?.issues) return res.status(400).json({ error: e.issues[0].message });
    return res.status(500).json({ error: 'Login failed' });
  }
}
