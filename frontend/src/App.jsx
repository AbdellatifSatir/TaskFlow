import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Calendar,
  Target,
  FolderPlus,
  CheckCircle2
} from 'lucide-react';

// API base URL
const API_URL = 'http://localhost:5000/api';

/**
 * Main To-Do Manager Application
 * Manages tasks organized by categories and weeks with Excel storage
 */
function App() {
  // State Management
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  
  // Form state for new/edited tasks
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    date: '',
    category: 'Self'
  });
  
  // Form state for new/edited goals
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: ''
  });
  
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchGoals();
  }, []);

  // =========================================================================
  // API Calls
  // =========================================================================

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_URL}/goals`);
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) return;
    
    try {
      await axios.post(`${API_URL}/tasks`, taskForm);
      fetchTasks();
      resetTaskForm();
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, updates);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await axios.post(`${API_URL}/categories`, { name: newCategoryName });
      fetchCategories();
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert(error.response?.data?.error || 'Failed to create category');
    }
  };

  const deleteCategory = async (categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"? Tasks will be moved to "Self".`)) return;
    
    try {
      await axios.delete(`${API_URL}/categories/${categoryName}`);
      fetchCategories();
      fetchTasks();
      if (selectedCategory === categoryName) {
        setSelectedCategory('All');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const createGoal = async () => {
    if (!goalForm.title.trim()) return;
    
    try {
      await axios.post(`${API_URL}/goals`, goalForm);
      fetchGoals();
      resetGoalForm();
      setIsAddingGoal(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const updateGoal = async (goalId) => {
    try {
      await axios.put(`${API_URL}/goals/${goalId}`, goalForm);
      fetchGoals();
      resetGoalForm();
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await axios.delete(`${API_URL}/goals/${goalId}`);
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // =========================================================================
  // Helper Functions
  // =========================================================================

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      date: '',
      category: 'Self'
    });
    setEditingTask(null);
  };

  const resetGoalForm = () => {
    setGoalForm({
      title: '',
      description: ''
    });
  };

  const startEditingTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      date: task.date,
      category: task.category
    });
    setEditingTask(task.id);
    setIsAddingTask(true);
  };

  const startEditingGoal = (goal) => {
    setGoalForm({
      title: goal.title,
      description: goal.description || ''
    });
    setEditingGoal(goal.id);
    setIsAddingGoal(true);
  };

  const saveEditedTask = async () => {
    if (!taskForm.title.trim()) return;
    
    try {
      await updateTask(editingTask, taskForm);
      resetTaskForm();
      setIsAddingTask(false);
    } catch (error) {
      console.error('Error saving edited task:', error);
    }
  };

  const toggleTaskCompletion = (task) => {
    updateTask(task.id, { ...task, completed: !task.completed });
  };

  // Get week number from date
  const getWeekNumber = (dateString) => {
    if (!dateString) return 0;
    
    const date = new Date(dateString);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  // Group tasks by week
  const groupTasksByWeek = (tasksToGroup) => {
    const grouped = {};
    
    tasksToGroup.forEach(task => {
      const week = task.date ? getWeekNumber(task.date) : 0;
      const weekLabel = week === 0 ? 'No Date' : `Week ${week}`;
      
      if (!grouped[weekLabel]) {
        grouped[weekLabel] = [];
      }
      grouped[weekLabel].push(task);
    });
    
    // Sort tasks within each week by date
    Object.keys(grouped).forEach(week => {
      grouped[week].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    
    return grouped;
  };

  // Filter tasks based on search query and selected category
  const getFilteredTasks = () => {
    let filtered = tasks;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        task.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByWeek(filteredTasks);

  // =========================================================================
  // Render Components
  // =========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 To-Do Manager</h1>
              <p className="text-gray-600 mt-1">Organize your tasks by categories and weeks</p>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderPlus size={20} />
                Categories
              </h2>
              
              {/* Category Filter Buttons */}
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === 'All'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  All Tasks ({tasks.length})
                </button>
                
                {categories.map(category => {
                  const count = tasks.filter(t => t.category === category).length;
                  return (
                    <div key={category} className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className={`flex-1 text-left px-4 py-2 rounded-lg transition ${
                          selectedCategory === category
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {category} ({count})
                      </button>
                      {!['Self', 'Job', 'PhD'].includes(category) && (
                        <button
                          onClick={() => deleteCategory(category)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Add Category Button */}
              {!isAddingCategory ? (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition"
                >
                  + Add Category
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && createCategory()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createCategory}
                      className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Tasks and Goals */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, description, or category..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Calendar size={24} />
                Tasks by Week
              </h2>
              
              {Object.keys(groupedTasks).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No tasks found</p>
                  <p className="text-sm mt-2">Add a new task to get started!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedTasks)
                    .sort(([a], [b]) => {
                      if (a === 'No Date') return 1;
                      if (b === 'No Date') return -1;
                      return parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]);
                    })
                    .map(([week, weekTasks]) => (
                      <div key={week} className="border-l-4 border-indigo-400 pl-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">{week}</h3>
                        <div className="space-y-3">
                          {weekTasks.map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggle={toggleTaskCompletion}
                              onEdit={startEditingTask}
                              onDelete={deleteTask}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Next Goals Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Target size={24} />
                  Next Goals
                </h2>
                <button
                  onClick={() => setIsAddingGoal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Goal
                </button>
              </div>
              
              {goals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No goals set yet. Add your future objectives!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={startEditingGoal}
                      onDelete={deleteGoal}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {isAddingTask && (
        <Modal
          title={editingTask ? 'Edit Task' : 'Add New Task'}
          onClose={() => {
            setIsAddingTask(false);
            resetTaskForm();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Task title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Task description (optional)"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={taskForm.date}
                onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={taskForm.category}
                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={editingTask ? saveEditedTask : createTask}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                {editingTask ? 'Save Changes' : 'Add Task'}
              </button>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  resetTaskForm();
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Goal Modal */}
      {isAddingGoal && (
        <Modal
          title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
          onClose={() => {
            setIsAddingGoal(false);
            resetGoalForm();
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                placeholder="Goal title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                placeholder="Goal description (optional)"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={editingGoal ? () => updateGoal(editingGoal) : createGoal}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
              >
                {editingGoal ? 'Save Changes' : 'Add Goal'}
              </button>
              <button
                onClick={() => {
                  setIsAddingGoal(false);
                  resetGoalForm();
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/**
 * Task Card Component
 * Displays individual task with completion toggle and action buttons
 */
function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 border-l-4 transition-all hover:shadow-md ${
      task.completed 
        ? 'border-green-400 bg-green-50' 
        : 'border-indigo-400'
    }`}>
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          onClick={() => onToggle(task)}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-indigo-500'
          }`}
        >
          {task.completed && <Check size={16} className="text-white" />}
        </button>
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-gray-900 ${
            task.completed ? 'line-through text-gray-500' : ''
          }`}>
            {task.title}
          </h4>
          
          {task.description && (
            <p className={`text-sm mt-1 ${
              task.completed ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
              {task.category}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(task.date)}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Goal Card Component
 * Displays individual goal with action buttons
 */
function GoalCard({ goal, onEdit, onDelete }) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="text-green-600 mt-1 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
          {goal.description && (
            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
          )}
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal Component
 * Reusable modal for forms and dialogs
 */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default App;
