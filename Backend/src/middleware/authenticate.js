// backend/src/middleware/authenticate.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');
    const decoded = jwt.verify(token, secret);
    // decoded: { userId, role, vendorId, iat, exp }
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Fetch permissions from the associated vendor
    const vendor = await Vendor.findById(user.vendorId).select('permissions');
    if (!vendor) {
      return res.status(401).json({ message: 'Associated vendor not found' });
    }
    
    req.user = {
      userId: user._id,
      role: user.role,
      vendorId: user.vendorId,
      email: user.email,
      permissions: vendor.permissions || {} // Add permissions from the vendor
    };
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
