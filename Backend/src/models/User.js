// backend/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['SuperVendor','RegionalVendor','CityVendor','Driver'],
    required: true
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
}, {
  timestamps: true
});

// Method to compare password
userSchema.methods.matchPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
