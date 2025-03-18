const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: String, required: true },
    items: [{ itemId: String, quantity: Number, price: Number }],
    total: { type: Number, required: true },
    paymentStatus: { 
        type: String, 
        enum: ["pending", "paid", "failed", "COD"], 
        default: "pending" 
    },
    orderStatus: { 
        type: String, 
        enum: ["pending", "processing", "completed", "cancelled"], 
        default: "pending" 
    },
    transactionId: { type: String, default: null },
    address: { type: String, required: true }, // ✅ Ensure Address is Required
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
