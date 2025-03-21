const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: [validator.isEmail, 'Invalid email format'],
  },
  phoneNumber: { type: String, default: null },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  role: { type: String, default: 'user' },
  userId: { type: String, unique: true, required: true },
  status: { type: String, default: 'active' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Hash the password only if it’s new or modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate password reset token
UserSchema.methods.generatePasswordReset = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
  return resetToken;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
