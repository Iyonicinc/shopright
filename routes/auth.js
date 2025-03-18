const express = require('express');
const crypto = require('crypto');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const { validateSignup } = require('../middleware/authmiddleware');

const router = express.Router();
const jwtSecret = 'my_secret_123';

// Generate unique User ID
async function generateUniqueUserId() {
  let userId;
  let userExists = true;
  while (userExists) {
    userId = Math.floor(10000 + Math.random() * 900000).toString();
    userExists = await User.exists({ userId });
  }
  return userId;
}
// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No user with that email address found' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333;">Hello ${user.name || 'User'}!</h2>
                    <p style="color: #555;">
                        You have requested to reset the password for your account on <strong>Shopright</strong>.
                        Click the button below to Reset Your Password.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetUrl}" style="display: inline-block; background-color: #75cfff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
                            RESET MY PASSWORD
                        </a>
                    </div>
                    <p style="color: #555; font-size: 14px;">
                        PS: If you did not initiate this request, reply to this email or write to 
                        <a href="mailto:help@shopright.com" style="color: #ff6600;">help@shopright.com</a> so we can look into a possible attempt to breach your account.
                    </p>
                    <p style="color: #555; font-size: 14px;">Best regards,<br>The Shopright Team</p>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />
                    <footer style="text-align: center; font-size: 12px; color: #888;">
                        <p>© Shopright 2024</p>
                        <p>The leading ecommerce</p>
                    </footer>
                </div>
            `,
        });        
        

        res.json({ message: 'Password reset link sent to your email' });
    } catch (err) {
        console.error('Error in forgot-password route:', err);
        res.status(500).json({ message: 'Error in sending reset link' });
    }
});

// Reset Password Route
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Error resetting password' });
    }
});


// Register a new user
router.post('/signup', validateSignup, async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already in use' });
  
        const userId = await generateUniqueUserId();

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password, // Save hashed password explicitly
            userId,
            role: 'user',
            status: 'active',
        });
  
        await newUser.save();
  
        const token = jwt.sign({ id: newUser._id, userId: newUser.userId, role: newUser.role }, jwtSecret, { expiresIn: '12h' });
  
        res.status(201).json({ token, userId: newUser.userId, role: newUser.role });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Log in an existing user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'User suspended, please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id, userId: user.userId, role: user.role }, jwtSecret, { expiresIn: '12h' });

        res.json({ token, userId: user.userId, role: user.role });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

module.exports = router;
