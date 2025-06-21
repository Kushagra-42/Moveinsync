// backend/src/utils/generateToken.js
import jwt from 'jsonwebtoken';

export function generateToken(user) {
  // user: mongoose doc or plain object with _id, role, vendorId
  const payload = {
    userId: user._id,
    role: user.role,
    vendorId: user.vendorId,
  };
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not defined');
  // e.g., expires in 1 day
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}
