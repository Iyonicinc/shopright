const jwt = require('jsonwebtoken');
const validator = require('validator');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Hardcoded admin credentials (you can replace these with your actual values)
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if hardcoded admin credentials are provided
    const { email, password } = req.body; // Assuming email and password are sent in the request body

    if (email === adminEmail && password === adminPassword) {
        // If the hardcoded admin credentials match, set the admin user and skip JWT verification
        req.user = {
            email: adminEmail,
            role: 'admin', // You can add other properties like 'id', etc.
        };
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Authorization header missing or malformed:', authHeader);
        return res.status(401).json({ message: 'Access denied, no token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Extract token

    try {
        const decoded = jwt.verify(token, 'my_secret_123');
        req.user = decoded;
    
        req.user.userId = decoded.id || decoded._id || null;
    
        if (!req.user.userId) {
            throw new Error('JWT payload does not contain a user ID.');
        }
    
        next();
    } catch (error) {
        console.error('Token verification error:', error);
    
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired, please log in again.' }); // Changed from 403 to 401
        }
    
        return res.status(401).json({ message: 'Invalid or malformed token.' }); // Changed from 403 to 401
    }
};

const validateSignup = (req, res, next) => {
    const { email, password } = req.body;

    // Check if email is valid
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if password is at least 6 characters long
    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    next(); // Proceed to the next middleware/route handler
};
module.exports = { authMiddleware, validateSignup };