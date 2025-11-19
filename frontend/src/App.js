import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import CalendarView from './CalendarView';
import AnalyticsDashboard from './AnalyticsDashboard';
import axios from 'axios';
import { Plus, Search, Trash2, Edit2, Check, X, Calendar, Target, Tag, CheckCircle2, Circle, Sparkles, LogOut, User } from 'lucide-react';
import './index.css';

// const API_URL = 'http://localhost:5000/api';
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_URL = `${process.env.REACT_APP_API_URL}/api` || 'http://localhost:5000/api';


// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Main Dashboard Component
function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nextGoals, setNextGoals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    priority: 'medium',
    tags: ''
  });
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: ''
  });
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axios.get(`${API_URL}/data`);
      console.log(`${API_URL}/data`)
      setTasks(response.data.tasks || []);
      setCategories(response.data.categories || []);
      setNextGoals(response.data.nextGoals || []);
      
      if (response.data.categories && response.data.categories.length > 0 && !taskForm.category) {
        setTaskForm(prev => ({ ...prev, category: response.data.categories[0].name }));
        setGoalForm(prev => ({ ...prev, category: response.data.categories[0].name }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
        navigate('/login');
      }
    }
  };

  const addTask = async () => {
    if (!taskForm.title || !taskForm.category) return;
    
    try {
      const tagsArray = taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      await axios.post(`${API_URL}/tasks`, {
        ...taskForm,
        tags: tagsArray
      });
      setTaskForm({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: categories[0]?.name || '',
        priority: 'medium',
        tags: ''
      });
      setShowAddTask(false);
      loadData();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, updates);
      loadData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);
      loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const saveEditedTask = async () => {
    if (!editingTask) return;
    const tagsArray = taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    await updateTask(editingTask._id, { ...taskForm, tags: tagsArray });
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: categories[0]?.name || '',
      priority: 'medium',
      tags: ''
    });
  };

  const addGoal = async () => {
    if (!goalForm.title || !goalForm.category) return;
    
    try {
      await axios.post(`${API_URL}/goals`, goalForm);
      setGoalForm({
        title: '',
        description: '',
        category: categories[0]?.name || ''
      });
      setShowAddGoal(false);
      loadData();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoal = async (goalId, updates) => {
    try {
      await axios.put(`${API_URL}/goals/${goalId}`, updates);
      loadData();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await axios.delete(`${API_URL}/goals/${goalId}`);
      loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const saveEditedGoal = async () => {
    if (!editingGoal) return;
    await updateGoal(editingGoal._id, goalForm);
    setEditingGoal(null);
    setGoalForm({
      title: '',
      description: '',
      category: categories[0]?.name || ''
    });
  };

  const addCategory = async () => {
    if (!categoryName) return;
    
    try {
      await axios.post(`${API_URL}/categories`, { name: categoryName });
      setCategoryName('');
      setShowAddCategory(false);
      loadData();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const deleteCategory = async (categoryId) => {
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    return matchesCategory;
  });

  const groupTasksByWeek = () => {
    const grouped = {};
    filteredTasks.forEach(task => {
      const week = task.week || 1;
      if (!grouped[week]) {
        grouped[week] = [];
      }
      grouped[week].push(task);
    });
    
    Object.keys(grouped).forEach(week => {
      grouped[week].sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    
    return grouped;
  };

  // ADD THIS NEW FUNCTION HERE:
  const getWeekDateRange = (tasks) => {
    if (!tasks || tasks.length === 0) return '';
    
    // Get all valid dates from tasks
    const dates = tasks
      .map(task => task.date ? new Date(task.date) : null)
      .filter(date => date !== null)
      .sort((a, b) => a - b);
    
    if (dates.length === 0) return '';
    
    // Get earliest and latest date
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    // Format dates
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  };

  const groupedTasks = groupTasksByWeek();
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
    <div className="min-h-screen bg-gray-50">

      {/* Simplified Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">TaskFlow</h1>
            </div>
            
            {/* Stats - Desktop Only */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-4 py-1 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{totalCount}</div>
                <div className="text-xs text-gray-500">Tasks</div>
              </div>
              <div className="text-center px-4 py-1 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{completedCount}</div>
                <div className="text-xs text-gray-500">Done</div>
              </div>
              <div className="text-center px-4 py-1 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-indigo-600">{nextGoals.length}</div>
                <div className="text-xs text-gray-500">Goals</div>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-700">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-t border-gray-200">
            <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
              <Calendar className="w-4 h-4" />
              Tasks
            </TabButton>
            <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
              <Calendar className="w-4 h-4" />
              Calendar
            </TabButton>
            <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
              <Target className="w-4 h-4" />
              Analytics
            </TabButton>
          </div>
        </div>
      </header>

      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen">
        {/* Render Active Tab Content */}
        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            categories={categories}
            nextGoals={nextGoals}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            groupedTasks={groupedTasks}
            getWeekDateRange={getWeekDateRange} 
            updateTask={updateTask}
            deleteTask={deleteTask}
            updateGoal={updateGoal}
            deleteGoal={deleteGoal}
            deleteCategory={deleteCategory}
            setShowAddTask={setShowAddTask}
            setShowAddGoal={setShowAddGoal}
            setShowAddCategory={setShowAddCategory}
            setEditingTask={setEditingTask}
            setEditingGoal={setEditingGoal}
            setTaskForm={setTaskForm}
            setGoalForm={setGoalForm}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView tasks={tasks} onTaskClick={() => {}} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}
      </div>

      {/* Modals */}
      {showAddTask && (
        <TaskModal
          title={editingTask ? "Edit Task" : "Create New Task"}
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          categories={categories}
          onSave={editingTask ? saveEditedTask : addTask}
          onClose={() => {
            setShowAddTask(false);
            setEditingTask(null);
            setTaskForm({
              title: '',
              description: '',
              date: new Date().toISOString().split('T')[0],
              category: categories[0]?.name || '',
              priority: 'medium',
              tags: ''
            });
          }}
        />
      )}

      {showAddGoal && (
        <GoalModal
          title={editingGoal ? "Edit Goal" : "Create New Goal"}
          goalForm={goalForm}
          setGoalForm={setGoalForm}
          categories={categories}
          onSave={editingGoal ? saveEditedGoal : addGoal}
          onClose={() => {
            setShowAddGoal(false);
            setEditingGoal(null);
            setGoalForm({
              title: '',
              description: '',
              category: categories[0]?.name || ''
            });
          }}
        />
      )}

      {showAddCategory && (
        <CategoryModal
          categoryName={categoryName}
          setCategoryName={setCategoryName}
          onSave={addCategory}
          onClose={() => {
            setShowAddCategory(false);
            setCategoryName('');
          }}
        />
      )}
    </div>
  );
}


// Tab Button Component - SIMPLIFIED
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}


// Tasks View Component - SIMPLIFIED & PROFESSIONAL
function TasksView({
  tasks, categories, nextGoals,
  selectedCategory, setSelectedCategory, groupedTasks, updateTask,
  deleteTask, updateGoal, deleteGoal, deleteCategory,
  setShowAddTask, setShowAddGoal, setShowAddCategory,
  setEditingTask, setEditingGoal, setTaskForm, setGoalForm
}) {
  return (
    <>
      {/* Simplified Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-medium text-gray-700"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTask(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Tag className="w-4 h-4" />
            Category
          </button>
          <button
            onClick={() => setShowAddGoal(true)}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Target className="w-4 h-4" />
            Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Tasks - 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks found</h3>
              <p className="text-gray-500 text-sm">Create your first task to get started</p>
            </div>
          ) : (
            Object.entries(groupedTasks).sort(([a], [b]) => b - a).map(([week, weekTasks]) => (
              <div key={week} className="bg-white rounded-lg border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {week}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Week {week}</h2>
                      <p className="text-xs text-gray-500">{getWeekDateRange(weekTasks)} • {weekTasks.length} tasks</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {weekTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onToggle={() => updateTask(task._id, { completed: !task.completed })}
                      onEdit={() => {
                        setEditingTask(task);
                        setTaskForm({
                          title: task.title,
                          description: task.description || '',
                          date: task.date?.split('T')[0] || '',
                          category: task.category,
                          priority: task.priority || 'medium',
                          tags: task.tags?.join(', ') || ''
                        });
                        setShowAddTask(true);
                      }}
                      onDelete={() => {
                        if (window.confirm('Delete this task?')) {
                          deleteTask(task._id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Goals */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Goals</h2>
            </div>
            <div className="p-4 space-y-2">
              {nextGoals.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-2">No goals yet</p>
              ) : (
                nextGoals.slice(0, 5).map(goal => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    onToggle={() => updateGoal(goal._id, { completed: !goal.completed })}
                    onEdit={() => {
                      setEditingGoal(goal);
                      setGoalForm({
                        title: goal.title,
                        description: goal.description || '',
                        category: goal.category
                      });
                      setShowAddGoal(true);
                    }}
                    onDelete={() => {
                      if (window.confirm('Delete this goal?')) {
                        deleteGoal(goal._id);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
            </div>
            <div className="p-4 space-y-1">
              {categories.map(cat => (
                <div key={cat._id} className="group flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <span className="text-xs text-gray-400">({tasks.filter(t => t.category === cat.name).length})</span>
                  </div>
                  {!['Self', 'Job', 'PhD'].includes(cat.name) && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${cat.name}"?`)) {
                          deleteCategory(cat._id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}




// Task Card Component - SIMPLIFIED & CLEAN
function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  const priorityLabels = {
    high: 'High',
    medium: 'Med',
    low: 'Low'
  };

  return (
    <div className={`group p-3 rounded-lg border transition-all ${
      task.completed 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            task.completed 
              ? 'bg-indigo-600 border-indigo-600' 
              : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-medium text-sm flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[task.priority] || priorityColors.medium}`}>
              {priorityLabels[task.priority] || 'Med'}
            </span>
          </div>
          
          {task.description && (
            <p className={`text-xs mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
              {task.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {task.date ? new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
            </span>
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.map((tag, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}



// Goal Card Component - SIMPLIFIED
function GoalCard({ goal, onToggle, onEdit, onDelete }) {
  return (
    <div className={`group p-3 rounded-lg border transition-all ${
      goal.completed 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-white border-gray-200 hover:border-indigo-300'
    }`}>
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            goal.completed 
              ? 'bg-indigo-600 border-indigo-600' 
              : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {goal.completed && <Check className="w-2.5 h-2.5 text-white" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {goal.title}
          </h4>
          {goal.description && (
            <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
          )}
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            {goal.category}
          </span>
        </div>
        
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
          <button 
            onClick={onEdit} 
            className="p-1 text-gray-600 hover:text-indigo-600"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1 text-gray-600 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}



// Task Modal Component - SIMPLIFIED
function TaskModal({ title, taskForm, setTaskForm, categories, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={taskForm.date}
              onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <select
            value={taskForm.category}
            onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={taskForm.tags}
            onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {title.includes('Edit') ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Goal Modal Component - SIMPLIFIED
function GoalModal({ title, goalForm, setGoalForm, categories, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <input
            type="text"
            placeholder="Goal title"
            value={goalForm.title}
            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={goalForm.description}
            onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm min-h-[80px]"
          />
          <select
            value={goalForm.category}
            onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {title.includes('Edit') ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Category Modal Component - SIMPLIFIED
function CategoryModal({ categoryName, setCategoryName, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Category</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <input
            type="text"
            placeholder="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}


// Main App Component with Routing
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
