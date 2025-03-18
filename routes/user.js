const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { authMiddleware } = require('../middleware/authmiddleware');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');


// Get all users (Admin only)
router.get('/admin/users', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
  
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
    }
  });

// Get user data
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email userId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ name: user.name, email: user.email, userId: user.userId });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error });
  }
});

router.post('/update', authMiddleware, async (req, res) => {
  const { firstName, lastName, email, phoneNumber } = req.body;

  if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
      const userId = req.user.id; // Get user ID from decoded token (authMiddleware)
      const user = await User.findById(userId);

      if (!user) {
          console.error('User not found:', userId);
          return res.status(404).json({ message: 'User not found.' });
      }

      // Update user details
      user.name = `${firstName} ${lastName}`;
      user.email = email;
      user.phoneNumber = phoneNumber;

      // Save the updated user to the database
      await user.save();

      res.status(200).json({ message: 'User details updated successfully.' });
  } catch (error) {
      console.error('Error in /update route:', error.message); // Log detailed error
      res.status(500).json({ message: 'An error occurred while updating user details.' });
  }
});


router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  try {
      // Find the authenticated user
      const user = await User.findById(req.user.id);
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Verify the current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          console.error('Incorrect password for user:', req.user.id);
          return res.status(403).json({ message: 'Current password is incorrect.' });
      }

      // Hash the new password before saving it
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;  // Save the hashed new password

      // Save the updated password
      await user.save();

      console.log('Password changed successfully for user:', req.user.id);
      res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
      console.error('Error in /change-password route:', error.message);
      res.status(500).json({ message: 'An error occurred while changing the password.' });
  }
});

// POST route: User submits account deletion request
router.post('/delete-account-request', async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
  }

  try {
      // Check if the user with the provided email exists
      const user = await User.findOne({ email });

      if (!user) {
          // If user doesn't exist, send an error response
          return res.status(404).json({ message: 'No such email found in our system.' });
      }

      // If user exists, proceed to send the email to the admin
      await sendEmail({
          to: 'iyoniccollections@gmail.com', // Admin's email
          subject: 'Account Deletion Request',
          html: `<p>A user has requested to delete their account.</p>
                 <p>Email: ${email}</p>`, // This will now show the user's email
      });

      // Notify the user that their request has been sent to the admin
      res.status(200).json({ message: 'Your request has been submitted. The admin will review it.' });
  } catch (error) {
      console.error('Error processing account deletion request:', error);
      res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
});

// DELETE route: Admin deletes account manually, notify user after deletion
router.delete('/delete-account', async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
  }

  try {
      // Assuming admin has already deleted the user from the database manually

      // Send confirmation email to the user
      await sendEmail({
          to: email, // User's email
          subject: 'Account Permanently Deleted',
          html: `<p>Your account has been permanently deleted.</p>
                 <p>All of your activities and details have been removed from our system.</p>`,
      });

      // Respond to admin that the user has been notified
      res.status(200).json({ message: 'The account has been deleted and the user has been notified.' });
  } catch (error) {
      console.error('Error sending deletion confirmation to user:', error);
      res.status(500).json({ message: 'An error occurred while notifying the user.' });
  }
});

module.exports = router;
