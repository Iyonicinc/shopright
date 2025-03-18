// routes/orders.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');
const Order = require('../models/order');


// ✅ Update Orders Route in `routes/orders.js`
router.get('/orders', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: 'User ID is required.' });

        const orders = await Order.find({ userId });
        
        if (!orders.length) {
            return res.status(404).json({ message: 'No orders found.' });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});



module.exports = router;
