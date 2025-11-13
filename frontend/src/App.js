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
  const [searchQuery, setSearchQuery] = useState('');
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
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const groupedTasks = groupTasksByWeek();
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header with Navigation */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  TaskFlow
                </h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}!</p>
              </div>
            </div>
            
            {/* Stats & User Menu */}
            <div className="hidden md:flex gap-4 items-center">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl px-6 py-3 text-white shadow-lg">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-xs opacity-90">Total Tasks</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl px-6 py-3 text-white shadow-lg">
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-xs opacity-90">Completed</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl px-6 py-3 text-white shadow-lg">
                <div className="text-2xl font-bold">{nextGoals.length}</div>
                <div className="text-xs opacity-90">Goals</div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-200">
            <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>
              📋 Tasks
            </TabButton>
            <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
              📅 Calendar
            </TabButton>
            <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
              📊 Analytics
            </TabButton>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render Active Tab Content */}
        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            categories={categories}
            nextGoals={nextGoals}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            groupedTasks={groupedTasks}
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

// Tab Button Component
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold rounded-t-xl transition-all ${
        active
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
      }`}
    >
      {children}
    </button>
  );
}

// Tasks View Component
function TasksView({
  tasks, categories, nextGoals, searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory, groupedTasks, updateTask,
  deleteTask, updateGoal, deleteGoal, deleteCategory,
  setShowAddTask, setShowAddGoal, setShowAddCategory,
  setEditingTask, setEditingGoal, setTaskForm, setGoalForm
}) {
  return (
    <>
      {/* Action Bar */}
      <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-indigo-300 transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-indigo-300 cursor-pointer font-medium text-gray-700"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddTask(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Task
          </button>

          <button
            onClick={() => setShowAddCategory(true)}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all flex items-center gap-2 font-semibold shadow-lg"
          >
            <Tag className="w-5 h-5" />
            Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 text-center border border-indigo-100">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-12 h-12 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
              <p className="text-gray-500">Start by adding your first task!</p>
            </div>
          ) : (
            Object.entries(groupedTasks).sort(([a], [b]) => a - b).map(([week, weekTasks]) => (
              <div key={week} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {week}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Week {week}</h2>
                    <p className="text-sm text-gray-500">{weekTasks.length} tasks</p>
                  </div>
                </div>
                <div className="space-y-3">
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
                      onDelete={() => deleteTask(task._id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Goals */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Next Goals</h2>
              </div>
              <button
                onClick={() => setShowAddGoal(true)}
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {nextGoals.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No goals yet</p>
              ) : (
                nextGoals.map(goal => (
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
                    onDelete={() => deleteGoal(goal._id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Categories</h2>
            </div>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat._id} className="group flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                    <span className="font-medium text-gray-700">{cat.name}</span>
                  </div>
                  {!['Self', 'Job', 'PhD'].includes(cat.name) && (
                    <button
                      onClick={() => deleteCategory(cat._id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
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

// Task Card Component
function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const priorityColors = {
    high: 'from-red-500 to-rose-600',
    medium: 'from-yellow-500 to-amber-600',
    low: 'from-green-500 to-emerald-600'
  };

  const categoryColors = {
    'Self': 'from-blue-400 to-cyan-500',
    'Job': 'from-green-400 to-emerald-500',
    'PhD': 'from-purple-400 to-pink-500',
    'default': 'from-gray-400 to-gray-500'
  };

  const priorityGradient = priorityColors[task.priority] || priorityColors.medium;
  const categoryGradient = categoryColors[task.category] || categoryColors.default;

  return (
    <div className={`group p-4 rounded-xl border-2 transition-all ${
      task.completed 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-lg'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            task.completed 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500' 
              : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {task.completed ? <Check className="w-4 h-4 text-white" /> : <Circle className="w-3 h-3 text-gray-300" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className={`font-semibold text-lg flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {task.title}
            </h3>
            <div className={`px-2 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${priorityGradient}`}>
              {task.priority?.toUpperCase() || 'MEDIUM'}
            </div>
          </div>
          {task.description && (
            <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${categoryGradient}`}>
              {task.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {task.date ? new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
            </span>
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Goal Card Component
function GoalCard({ goal, onToggle, onEdit, onDelete }) {
  return (
    <div className={`group p-4 rounded-xl border-2 transition-all ${
      goal.completed 
        ? 'bg-purple-50 border-purple-200' 
        : 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-md'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
            goal.completed 
              ? 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-500' 
              : 'border-purple-300 hover:border-purple-400'
          }`}
        >
          {goal.completed && <Check className="w-3 h-3 text-white" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${goal.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {goal.title}
          </h4>
          {goal.description && (
            <p className={`text-xs mt-1 ${goal.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {goal.description}
            </p>
          )}
          <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-md">
            {goal.category}
          </span>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onDelete} 
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Task Modal Component
function TaskModal({ title, taskForm, setTaskForm, categories, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
          />
          <textarea
            placeholder="Description (optional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 min-h-[80px]"
          />
          <input
            type="date"
            value={taskForm.date}
            onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
          />
          <select
            value={taskForm.category}
            onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select
            value={taskForm.priority}
            onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
          >
            <option value="low">🟢 Low Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="high">🔴 High Priority</option>
          </select>
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={taskForm.tags}
            onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={onSave}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 font-semibold shadow-lg"
          >
            {title.includes('Edit') ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Goal Modal Component
function GoalModal({ title, goalForm, setGoalForm, categories, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Goal title"
            value={goalForm.title}
            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
          />
          <textarea
            placeholder="Description (optional)"
            value={goalForm.description}
            onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 min-h-[80px]"
          />
          <select
            value={goalForm.category}
            onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={onSave}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 font-semibold shadow-lg"
          >
            {title.includes('Edit') ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ categoryName, setCategoryName, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add New Category
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-400"
          />
          <button
            onClick={onSave}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 font-semibold shadow-lg"
          >
            Create Category
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
