const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const EXCEL_FILE = path.join(__dirname, 'tasks.xlsx');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function: Calculate week number from a date
function getWeekNumber(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

// Helper function: Read data from Excel
function readExcelData() {
  try {
    if (!fs.existsSync(EXCEL_FILE)) {
      // Create initial structure if file doesn't exist
      return {
        tasks: [],
        categories: [
          { id: 1, name: 'Self' },
          { id: 2, name: 'Job' },
          { id: 3, name: 'PhD' }
        ],
        nextGoals: []
      };
    }

    const workbook = XLSX.readFile(EXCEL_FILE);
    
    // Read Tasks sheet
    const tasksSheet = workbook.Sheets['Tasks'];
    const tasks = tasksSheet ? XLSX.utils.sheet_to_json(tasksSheet) : [];
    
    // Read Categories sheet
    const categoriesSheet = workbook.Sheets['Categories'];
    const categories = categoriesSheet ? XLSX.utils.sheet_to_json(categoriesSheet) : [
      { id: 1, name: 'Self' },
      { id: 2, name: 'Job' },
      { id: 3, name: 'PhD' }
    ];
    
    // Read Next Goals sheet
    const goalsSheet = workbook.Sheets['NextGoals'];
    const nextGoals = goalsSheet ? XLSX.utils.sheet_to_json(goalsSheet) : [];

    return { tasks, categories, nextGoals };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return {
      tasks: [],
      categories: [
        { id: 1, name: 'Self' },
        { id: 2, name: 'Job' },
        { id: 3, name: 'PhD' }
      ],
      nextGoals: []
    };
  }
}

// Helper function: Write data to Excel
function writeExcelData(data) {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create Tasks sheet
    const tasksSheet = XLSX.utils.json_to_sheet(data.tasks || []);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');
    
    // Create Categories sheet
    const categoriesSheet = XLSX.utils.json_to_sheet(data.categories || []);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');
    
    // Create Next Goals sheet
    const goalsSheet = XLSX.utils.json_to_sheet(data.nextGoals || []);
    XLSX.utils.book_append_sheet(workbook, goalsSheet, 'NextGoals');
    
    XLSX.writeFile(workbook, EXCEL_FILE);
    return true;
  } catch (error) {
    console.error('Error writing Excel file:', error);
    return false;
  }
}

// ============= API ENDPOINTS =============

// Get all data (tasks, categories, nextGoals)
app.get('/api/data', (req, res) => {
  const data = readExcelData();
  res.json(data);
});

// ============= TASKS ENDPOINTS =============

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const data = readExcelData();
  res.json(data.tasks);
});

// Add a new task
app.post('/api/tasks', (req, res) => {
  const data = readExcelData();
  const newTask = {
    id: Date.now(),
    title: req.body.title,
    description: req.body.description || '',
    date: req.body.date,
    category: req.body.category,
    completed: req.body.completed || false,
    week: getWeekNumber(req.body.date)
  };
  
  data.tasks.push(newTask);
  
  if (writeExcelData(data)) {
    res.status(201).json(newTask);
  } else {
    res.status(500).json({ error: 'Failed to save task' });
  }
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const data = readExcelData();
  const taskId = parseInt(req.params.id);
  const taskIndex = data.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  data.tasks[taskIndex] = {
    ...data.tasks[taskIndex],
    title: req.body.title !== undefined ? req.body.title : data.tasks[taskIndex].title,
    description: req.body.description !== undefined ? req.body.description : data.tasks[taskIndex].description,
    date: req.body.date !== undefined ? req.body.date : data.tasks[taskIndex].date,
    category: req.body.category !== undefined ? req.body.category : data.tasks[taskIndex].category,
    completed: req.body.completed !== undefined ? req.body.completed : data.tasks[taskIndex].completed,
    week: req.body.date ? getWeekNumber(req.body.date) : data.tasks[taskIndex].week
  };
  
  if (writeExcelData(data)) {
    res.json(data.tasks[taskIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const data = readExcelData();
  const taskId = parseInt(req.params.id);
  const taskIndex = data.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  data.tasks.splice(taskIndex, 1);
  
  if (writeExcelData(data)) {
    res.json({ message: 'Task deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ============= CATEGORIES ENDPOINTS =============

// Get all categories
app.get('/api/categories', (req, res) => {
  const data = readExcelData();
  res.json(data.categories);
});

// Add a new category
app.post('/api/categories', (req, res) => {
  const data = readExcelData();
  const newCategory = {
    id: Date.now(),
    name: req.body.name
  };
  
  data.categories.push(newCategory);
  
  if (writeExcelData(data)) {
    res.status(201).json(newCategory);
  } else {
    res.status(500).json({ error: 'Failed to save category' });
  }
});

// Delete a category
app.delete('/api/categories/:id', (req, res) => {
  const data = readExcelData();
  const categoryId = parseInt(req.params.id);
  const categoryIndex = data.categories.findIndex(c => c.id === categoryId);
  
  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  data.categories.splice(categoryIndex, 1);
  
  if (writeExcelData(data)) {
    res.json({ message: 'Category deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============= NEXT GOALS ENDPOINTS =============

// Get all next goals
app.get('/api/goals', (req, res) => {
  const data = readExcelData();
  res.json(data.nextGoals);
});

// Add a new goal
app.post('/api/goals', (req, res) => {
  const data = readExcelData();
  const newGoal = {
    id: Date.now(),
    title: req.body.title,
    description: req.body.description || '',
    category: req.body.category,
    completed: req.body.completed || false
  };
  
  data.nextGoals.push(newGoal);
  
  if (writeExcelData(data)) {
    res.status(201).json(newGoal);
  } else {
    res.status(500).json({ error: 'Failed to save goal' });
  }
});

// Update a goal
app.put('/api/goals/:id', (req, res) => {
  const data = readExcelData();
  const goalId = parseInt(req.params.id);
  const goalIndex = data.nextGoals.findIndex(g => g.id === goalId);
  
  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  
  data.nextGoals[goalIndex] = {
    ...data.nextGoals[goalIndex],
    title: req.body.title !== undefined ? req.body.title : data.nextGoals[goalIndex].title,
    description: req.body.description !== undefined ? req.body.description : data.nextGoals[goalIndex].description,
    category: req.body.category !== undefined ? req.body.category : data.nextGoals[goalIndex].category,
    completed: req.body.completed !== undefined ? req.body.completed : data.nextGoals[goalIndex].completed
  };
  
  if (writeExcelData(data)) {
    res.json(data.nextGoals[goalIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete a goal
app.delete('/api/goals/:id', (req, res) => {
  const data = readExcelData();
  const goalId = parseInt(req.params.id);
  const goalIndex = data.nextGoals.findIndex(g => g.id === goalId);
  
  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  
  data.nextGoals.splice(goalIndex, 1);
  
  if (writeExcelData(data)) {
    res.json({ message: 'Goal deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Excel file location: ${EXCEL_FILE}`);
});
