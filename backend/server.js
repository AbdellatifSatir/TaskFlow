const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');

const app = express();
// const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abdosatiir_db_user:abdosatiir_db_user@todoapp.bgdon1e.mongodb.net/?appName=todoapp';
// Already there, just verify:
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ============= MONGODB SCHEMAS =============

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  date: Date,
  category: String,
  completed: { type: Boolean, default: false },
  week: Number,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  category: String,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const Task = mongoose.model('Task', TaskSchema);
const Goal = mongoose.model('Goal', GoalSchema);

// ============= AUTH MIDDLEWARE =============

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============= HELPER FUNCTIONS =============

function getWeekNumber(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

// ============= AUTH ENDPOINTS =============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Create default categories for new user
    const defaultCategories = ['Self', 'Job', 'PhD'];
    for (const name of defaultCategories) {
      await new Category({ userId: user._id, name }).save();
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TASKS ENDPOINTS =============

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ date: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, date, category, priority, tags } = req.body;
    
    const task = new Task({
      userId: req.user.userId,
      title,
      description,
      date,
      category,
      priority: priority || 'medium',
      tags: tags || [],
      week: getWeekNumber(date)
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key];
    });

    if (req.body.date) {
      task.week = getWeekNumber(req.body.date);
    }

    if (req.body.completed && !task.completedAt) {
      task.completedAt = new Date();
    } else if (!req.body.completed) {
      task.completedAt = null;
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Task.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CATEGORIES ENDPOINTS =============

app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.userId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const category = new Category({
      userId: req.user.userId,
      name: req.body.name
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Category.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= GOALS ENDPOINTS =============

app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const goal = new Goal({
      userId: req.user.userId,
      ...req.body
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    Object.keys(req.body).forEach(key => {
      goal[key] = req.body[key];
    });

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Goal.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= ANALYTICS ENDPOINT =============

app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    const priorityBreakdown = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };
    
    const categoryBreakdown = {};
    tasks.forEach(task => {
      if (task.category) {
        categoryBreakdown[task.category] = (categoryBreakdown[task.category] || 0) + 1;
      }
    });
    
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= last7Days);
    const recentCompleted = recentTasks.filter(t => t.completed).length;
    
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });
      
      weeklyData.push({
        date: dayStart.toISOString().split('T')[0],
        created: dayTasks.length,
        completed: dayTasks.filter(t => t.completed).length
      });
    }
    
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      priorityBreakdown,
      categoryBreakdown,
      weeklyData,
      recentActivity: {
        tasksCreated: recentTasks.length,
        tasksCompleted: recentCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= EXPORT ENDPOINTS =============

app.get('/api/export/csv', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ date: 1 });
    
    const csvData = tasks.map(task => ({
      Title: task.title,
      Description: task.description || '',
      Date: task.date ? new Date(task.date).toLocaleDateString() : '',
      Category: task.category,
      Priority: task.priority,
      Tags: task.tags.join(', '),
      Status: task.completed ? 'Completed' : 'Pending',
      Week: task.week
    }));
    
    const csv = stringify(csvData, { header: true });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/export/pdf', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ date: 1 });
    const user = await User.findById(req.user.userId);
    
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.pdf');
    
    doc.pipe(res);
    
    doc.fontSize(24).text('Task Report', { align: 'center' });
    doc.fontSize(12).text(`Generated for: ${user.username}`, { align: 'center' });
    doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Tasks: ${tasks.length}`);
    doc.text(`Completed: ${tasks.filter(t => t.completed).length}`);
    doc.text(`Pending: ${tasks.filter(t => !t.completed).length}`);
    doc.moveDown(2);
    
    doc.fontSize(14).text('Tasks', { underline: true });
    doc.moveDown(1);
    
    tasks.forEach((task, index) => {
      if (index > 0) doc.moveDown(0.5);
      
      doc.fontSize(12).text(`${index + 1}. ${task.title}`, { bold: true });
      if (task.description) {
        doc.fontSize(9).text(`   ${task.description}`, { indent: 20 });
      }
      doc.fontSize(8).text(`   Category: ${task.category} | Priority: ${task.priority} | Status: ${task.completed ? 'Completed' : 'Pending'}`, { indent: 20 });
      if (task.tags.length > 0) {
        doc.text(`   Tags: ${task.tags.join(', ')}`, { indent: 20 });
      }
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= AGGREGATE DATA ENDPOINT =============

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const [tasks, categories, goals] = await Promise.all([
      Task.find({ userId: req.user.userId }).sort({ date: 1 }),
      Category.find({ userId: req.user.userId }),
      Goal.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    ]);
    
    res.json({ tasks, categories, nextGoals: goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Add CORS configuration for production
// const corsOptions = {
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// };
// app.use(cors(corsOptions));

// app.use(cors({
//   origin: "*",
//   credentials: true
// }));

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true
};
app.use(cors(corsOptions));



// Update port configuration
const PORT = process.env.PORT || 5000;



// Start server
app.listen(PORT, () => {
  console.log(`✅ Enhanced backend server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB: ${MONGODB_URI}`);
  console.log(`🔐 JWT authentication enabled`);
});
