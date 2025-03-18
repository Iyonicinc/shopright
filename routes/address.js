const express = require('express');
const router = express.Router();
const Address = require('../models/address'); // Import the Address model
const { authMiddleware } = require('../middleware/authmiddleware'); // Import your authentication middleware

// Create a new address
router.post('/', authMiddleware, async (req, res) => {

  try {
      const { firstName, lastName, phone, address, region, city } = req.body;

      if (!firstName || !lastName || !phone || !address || !region || !city) {
          return res.status(400).json({ message: 'All required fields must be provided.' });
      }

      const userId = req.user.userId;  // Ensure you're using `userId` from req.user
        if (!userId) {
            return res.status(400).json({ message: 'User ID is missing.' });
        }

      const newAddress = new Address({
          userId:req.user.id,
          firstName,
          lastName,
          phone,
          address,
          region,
          city,
          additionalPhone: req.body.additionalPhone || '',
          isDefault: req.body.isDefault || false,
      });

      const savedAddress = await newAddress.save();
      res.status(201).json(savedAddress);
  } catch (error) {
      console.error('Error saving address:', error);
      res.status(500).json({ message: 'Error saving address', details: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Consistently use `userId`
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
      const addresses = await Address.find({ userId });

      // Return an empty array if no addresses are found
      if (!addresses.length) {
          return res.status(200).json([]);
      }

      res.status(200).json(addresses);
  } catch (error) {
      console.error('Error fetching addresses:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update an address
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Consistently use `userId`
    const addressId = req.params.id;

    const address = await Address.findOneAndUpdate(
        { _id: addressId, userId },
        req.body,
        { new: true }
    );

    if (!address) return res.status(404).json({ message: 'Address not found' });

    res.json({ message: 'Address updated successfully', address });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
      const userId = req.user.id;
      const addressId = req.params.id;

       const address = await Address.findOneAndDelete({ _id: addressId, userId: req.user.id }); // Match _id and userId
        if (!address) {
            console.warn('Address not found or does not belong to user:', { addressId, userId });
            return res.status(404).json({ message: 'Address not found or does not belong to the user' });
        }

        res.json({ message: 'Address deleted successfully', address });
    } catch (error) {
        console.error('Error deleting address:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Set an address as default
router.patch('/:id/set-default', authMiddleware, async (req, res) => {
  try {
      const userId = req.user.userId; // Consistently use `userId`
      const addressId = req.params.id;

      // Set all other addresses for this user as non-default
      await Address.updateMany({ userId, isDefault: true }, { isDefault: false });

      // Set the specified address as default
      await Address.findByIdAndUpdate(addressId, { isDefault: true });

      res.json({ message: 'Default address updated' });
  } catch (error) {
      console.error('Error setting default address:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
