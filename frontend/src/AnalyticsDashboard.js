import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Target, Download } from 'lucide-react';

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/export/csv', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/export/pdf', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Analytics Dashboard
        </h2>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          title="Total Tasks"
          value={analytics.totalTasks}
          gradient="from-indigo-500 to-blue-600"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          title="Completed"
          value={analytics.completedTasks}
          gradient="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title="Pending"
          value={analytics.pendingTasks}
          gradient="from-orange-500 to-amber-600"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Completion Rate"
          value={`${analytics.completionRate}%`}
          gradient="from-purple-500 to-pink-600"
        />
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Priority Breakdown</h3>
        <div className="space-y-4">
          <PriorityBar
            label="High Priority"
            value={analytics.priorityBreakdown.high}
            total={analytics.totalTasks}
            color="from-red-500 to-rose-600"
          />
          <PriorityBar
            label="Medium Priority"
            value={analytics.priorityBreakdown.medium}
            total={analytics.totalTasks}
            color="from-yellow-500 to-amber-600"
          />
          <PriorityBar
            label="Low Priority"
            value={analytics.priorityBreakdown.low}
            total={analytics.totalTasks}
            color="from-green-500 to-emerald-600"
          />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Tasks by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
            <div
              key={category}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
            >
              <div className="text-2xl font-bold text-purple-600">{count}</div>
              <div className="text-sm text-gray-600">{category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Last 7 Days Activity</h3>
        <div className="space-y-3">
          {analytics.weeklyData.map((day, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600">
                {new Date(day.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex-1 flex gap-2">
                <div
                  className="h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(day.created / 10) * 100}%`, minWidth: day.created > 0 ? '40px' : '0' }}
                >
                  {day.created > 0 && `${day.created}`}
                </div>
                <div
                  className="h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${(day.completed / 10) * 100}%`, minWidth: day.completed > 0 ? '40px' : '0' }}
                >
                  {day.completed > 0 && `${day.completed}`}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-500 rounded" />
            <span className="text-gray-600">Created</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded" />
            <span className="text-gray-600">Completed</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity (Last 7 Days)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <div className="text-3xl font-bold text-indigo-600">
              {analytics.recentActivity.tasksCreated}
            </div>
            <div className="text-sm text-gray-600 mt-1">Tasks Created</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">
              {analytics.recentActivity.tasksCompleted}
            </div>
            <div className="text-sm text-gray-600 mt-1">Tasks Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-90 mt-1">{title}</div>
    </div>
  );
}

// Priority Bar Component
function PriorityBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{value} tasks ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`bg-gradient-to-r ${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
