// backend/src/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken.js';
import Vendor from '../models/Vendor.js';

export async function loginUser(req, res) {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email });
  if (!user) {
    console.log('No user found with that email');
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const isMatch = await user.matchPassword(password);
  console.log('Password match:', isMatch);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = generateToken(user);
  res.json({ token });
}

export async function getMe(req, res) {
  const { userId, role, vendorId, email } = req.user;
  let permissions = {};
  try {
    const vendor = await Vendor.findById(vendorId).select('permissions');
    if (vendor && vendor.permissions) {
      permissions = vendor.permissions;
    }
  } catch (err) {
    console.warn('Error fetching vendor permissions:', err);
  }
  res.json({ userId, email, role, vendorId, permissions });
}
