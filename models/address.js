const mongoose = require('mongoose');

// Define the Address schema
const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  additionalPhone: { type: String },
  address: { type: String, required: true },
  region: { type: String, required: true },
  city: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt


module.exports = mongoose.model('Address', addressSchema);
