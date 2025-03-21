const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For generating reset tokens
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const ordersRoutes = require('./routes/orders');
const User = require('./models/user');
const Order = require('./models/order');
const addressRoutes = require('./routes/address');
const dotenv = require('dotenv');
const path = require('path');
const adminRoutes = require('./routes/admin');


dotenv.config();

const app = express();

app.use(cors({ origin: 'https://shopright.iyonicorp.com' }));
app.use(bodyParser.json()); 
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/', ordersRoutes);
app.use('/api/', adminRoutes);

// Hard-coded admin credentials
const adminEmail = 'iyoniccollections@gmail.com';
const adminPassword = '1234567890'; // Consider hashing this in a real-world app for security reasons
const jwtSecret = 'my_secret_123';

// Function to generate a unique numeric userId
async function generateUniqueUserId() {
  let userId;
  let userExists = true;

  // Keep generating new userId until we find a unique one
  while (userExists) {
    userId = Math.floor(10000 + Math.random() * 900000); // Generate a 5-digit number
    userExists = await User.exists({ userId });
  }

  return userId;
}


function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.warn('Access attempt without token.');
    return res.status(401).json({ message: 'Access denied, no token provided.' });
  }

  jwt.verify(token, jwtSecret, async (err, decoded) => {
    if (err) {
        console.error('JWT Error:', err); // Detailed logging
        const message = err.name === 'TokenExpiredError' ? 'Token expired, please log in again.' : 'Invalid token.';
        return res.status(403).json({ message });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (user.status === 'suspended') {
        console.warn('Suspended user access attempt:', user.email);
        return res.status(403).json({ message: 'User suspended, please contact support.' });
      }

      req.user = user; // Attach user object to request
      next(); // Proceed to next middleware or route
    } catch (dbError) {
      console.error('Database error during user fetch:', dbError);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  });
}

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access restricted to admins' });
  }
  next();
}

app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 users per page

  try {
    const users = await User.find()
      .select('name email userId status role')
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await User.countDocuments();
    const totalPages = Math.ceil(count / limit);

    res.json({
      users,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages, // Check if there are more pages
      hasPreviousPage: page > 1,      // Check if there are previous pages
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});


// Admin route to update user status (activate/suspend)
app.patch('/admin/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expected values: "active", "suspended"

  try {
    const user = await User.findOne({ $or: [{ userId: id }, { _id: id }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = status;
    await user.save();

    res.json({ message: `User status updated to ${status} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// Admin route to delete a user
app.delete('/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});


// Route to register a new user
app.post('/api/signup', async (req, res) => {

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    // Generate a unique user ID
    const userId = await generateUniqueUserId();
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      userId,
      role: 'admin', // Default role
      status: 'active',
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, userId: newUser.userId, role: newUser.role }, 'my_secret_123', { expiresIn: '12h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: newUser.userId,
  });
} catch (error) {
  console.error('Error registering user:', error);
  res.status(500).json({ message: 'Error registering user' });
}
});


// Route to log in and get a JWT token (handles both admin and regular users)
app.post('/api/login',async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Received login request for:', email);

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error('User not found for email:', email);
      return res.status(404).json({ message: 'Invalid email or password' });
    }

    console.log('Entered Password:', password);
    console.log('Stored Hashed Password (in DB):', user.password);

    // Compare the provided password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password match status:', validPassword);

    if (!validPassword) {
      console.error('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check user status
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'User suspended, contact support.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, userId: user.userId, role: user.role }, jwtSecret, { expiresIn: '12h' });

    const message = user.role === 'admin' ? 'Logged in as admin' : 'Logged in successfully';
    console.log('Login successful, token generated:', token);
    res.json({ token, userId: user.userId, role: user.role, message });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route to get current logged-in user details (only their own details)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
      const user = await User.findOne({ userId: req.user.userId }).select('name email userId phone'); // Use userId from the token
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json(user); // Send user details as JSON
  } catch (err) {
      console.error('Error fetching user details:', err);
      res.status(500).json({ message: 'Server error' });
  }
});


// Initialize the admin if not already created
async function initializeAdmin() {
  try {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new User({
        name: 'Ian Karani',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // Ensure role is set to "admin"
        status: 'active',
      });
      await newAdmin.save();
    } else {
      console.log('Admin Ian under controll');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

initializeAdmin();

app.get('/admin/dashboard', (req, res) => {
  res.json({
      newOrders: 10,
      totalIncome: 5000,
      totalExpense: 2000,
      newUsers: 50,
      summary: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          values: [200, 400, 300, 500, 700],
      },
      topProducts: [
          { name: 'Product A', image: 'path/to/image1.jpg', description: 'Best Seller', price: 'KSh 1500', rating: 4 },
          { name: 'Product B', image: 'path/to/image2.jpg', description: 'High Quality', price: 'KSh 2000', rating: 5 },
      ],
      activities: ['Order #123 shipped', 'Order #124 delivered'],
      recentProducts: [
          { name: 'Product C', image: 'path/to/image3.jpg' },
          { name: 'Product D', image: 'path/to/image4.jpg' },
      ],
  });
});


app.post('/api/orders', async (req, res) => {
  try {
      const { userId, name, email, phone, address, items, total, paymentMethod, transactionId } = req.body;

      let finalUserId = userId || "guest";  

      // ✅ Ensure paymentMethod is always in lowercase for consistency
      const formattedPaymentMethod = paymentMethod ? paymentMethod.toLowerCase() : "";

      // ✅ Fix payment status logic
      let paymentStatus = "pending";  // Default status

      if (formattedPaymentMethod === "cod") {
          paymentStatus = "COD";  // ✅ Now properly assigns COD
      } else if (transactionId) {
          paymentStatus = "paid";  
      } else {
          paymentStatus = "failed";  
      }

      const newOrder = new Order({
          userId: finalUserId,  
          name,
          email,
          phone,
          address,
          items,
          total,
          paymentStatus,
          orderStatus: "pending",
          transactionId: transactionId || null,
      });

      await newOrder.save();

      res.status(201).json({ message: "Order placed successfully", orderId: newOrder._id });
  } catch (error) {
      console.error("❌ Error placing order:", error);
      res.status(500).json({ message: "Error placing order" });
  }
});


// ✅ Admin route to view all orders (filtered by status if needed)
app.get('/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.query; // Accept status as a query parameter
  const filter = status ? { orderStatus: status } : {}; // ✅ Use correct field name

  try {
      const orders = await Order.find(filter)
          .sort({ createdAt: -1 })
          .populate('userId', 'name email'); // ✅ Ensures user data is included

      res.json(orders);
  } catch (error) {
      console.error('❌ Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders' });
  }
});

// ✅ Admin route to view a single order
app.get('/admin/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
      const order = await Order.findById(req.params.id).populate('userId', 'name email');

      if (!order) return res.status(404).json({ message: 'Order not found' });

      res.json(order);
  } catch (error) {
      console.error('❌ Error fetching order:', error);
      res.status(500).json({ message: 'Error fetching order' });
  }
});

// ✅ Admin route to update order status (Only allows correct status transitions)
app.patch('/admin/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body; // ✅ Fix: Use orderStatus

  try {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      // ✅ Ensure correct transition
      const allowedTransitions = {
          pending: "processing",
          processing: "completed",
      };

      if (order.orderStatus !== "pending" && order.orderStatus !== "processing") {
          return res.status(400).json({ message: "Invalid order status transition." });
      }

      if (allowedTransitions[order.orderStatus] !== orderStatus) {
          return res.status(400).json({ message: `Invalid transition from ${order.orderStatus} to ${orderStatus}` });
      }

      order.orderStatus = orderStatus; // ✅ Now correctly updates
      await order.save();

      res.json({ message: `Order status updated to ${orderStatus}` });
  } catch (error) {
      console.error('❌ Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status' });
  }
});



const salesReportSchema = new mongoose.Schema({
  conversionRate: Number,
  uniquePurchases: Number,
  avgOrderValue: Number,
  orderQuantity: Number,
  mrrGrowth: Number,
  avgMRRPerCustomer: Number,
  retention: Number,
  expansion: Number,
  cancellations: Number,
  mrrGrowthData: {
      labels: [String],
      values: [Number],
  },
  retentionData: {
      labels: [String],
      expansions: [Number],
      cancellations: [Number],
  },
});

const SalesReport = mongoose.model('SalesReport', salesReportSchema);

// API to fetch sales reports
app.get('/admin/sales-reports', async (req, res) => {
  try {
      const salesReport = await SalesReport.findOne().sort({ _id: -1 });
      if (!salesReport) {
          return res.status(404).json({ message: 'No sales report found.' });
      }
      res.json(salesReport);
  } catch (error) {
      console.error('Error fetching sales reports:', error);
      res.status(500).json({ message: 'Error fetching sales reports.' });
  }
});


// Seed Sales Report Data (for development/testing)
app.post('/admin/sales-reports/seed', async (req, res) => {
  try {
      const data = {
          conversionRate: 5.9,
          uniquePurchases: 150,
          avgOrderValue: 50.75,
          orderQuantity: 5000,
          mrrGrowth: 3500,
          avgMRRPerCustomer: 45.6,
          retention: 300,
          expansion: 500,
          cancellations: 450,
          mrrGrowthData: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', ],
              values: [13, 120, 127, 160, 1000, 1400, 988, 2500, 2500, 2476, 3120, 3489 ],
          },
          retentionData: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May','June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', ],
              expansions: [50, 70, 75, 80, 84, 71, 89, 104, 115, 260, 293, 251 ],
              cancellations: [10, 15, 62, 18, 30, 25, 47, 9, 24, 17, 22, 32 ],
          },
      };

      await SalesReport.create(data);
      res.status(201).json({ message: 'Sample sales report seeded successfully.' });
  } catch (error) {
      console.error('Error seeding sales reports:', error);
      res.status(500).json({ message: 'Error seeding sales reports.' });
  }
});


// Temporary route to reactivate the admin
app.patch('/admin/reactivate', async (req, res) => {
  try {
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.status = 'active';
    await admin.save();
  
    res.json({ message: 'Admin reactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reactivating admin' });
  }
});

app.get('/debug/admin', async (_req, res) => {
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json({ email: admin.email, role: admin.role, status: admin.status });
});

const dbURI = process.env.MONGODB_URI || 'mongodb+srv://iyoniccollections:Karani12@cluster1.wd7sr.mongodb.net/shopright';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});