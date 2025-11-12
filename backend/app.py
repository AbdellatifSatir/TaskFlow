"""
Flask Backend for To-Do Task Manager
Handles CRUD operations and Excel file I/O
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Excel file path
EXCEL_FILE = 'tasks.xlsx'

def initialize_excel():
    """Initialize Excel file with default structure if it doesn't exist"""
    if not os.path.exists(EXCEL_FILE):
        # Create default dataframes
        tasks_df = pd.DataFrame(columns=['id', 'title', 'description', 'date', 'category', 'completed'])
        categories_df = pd.DataFrame({
            'name': ['Self', 'Job', 'PhD']
        })
        goals_df = pd.DataFrame(columns=['id', 'title', 'description'])
        
        # Write to Excel with multiple sheets
        with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
            tasks_df.to_excel(writer, sheet_name='Tasks', index=False)
            categories_df.to_excel(writer, sheet_name='Categories', index=False)
            goals_df.to_excel(writer, sheet_name='NextGoals', index=False)
        
        print(f"✅ Created new Excel file: {EXCEL_FILE}")

def read_excel():
    """Read all data from Excel file"""
    try:
        tasks_df = pd.read_excel(EXCEL_FILE, sheet_name='Tasks')
        categories_df = pd.read_excel(EXCEL_FILE, sheet_name='Categories')
        goals_df = pd.read_excel(EXCEL_FILE, sheet_name='NextGoals')
        
        # Handle empty dataframes
        if tasks_df.empty:
            tasks_df = pd.DataFrame(columns=['id', 'title', 'description', 'date', 'category', 'completed'])
        if categories_df.empty:
            categories_df = pd.DataFrame(columns=['name'])
        if goals_df.empty:
            goals_df = pd.DataFrame(columns=['id', 'title', 'description'])
            
        return tasks_df, categories_df, goals_df
    except Exception as e:
        print(f"❌ Error reading Excel: {e}")
        initialize_excel()
        return read_excel()

def write_excel(tasks_df, categories_df, goals_df):
    """Write all data to Excel file"""
    try:
        with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
            tasks_df.to_excel(writer, sheet_name='Tasks', index=False)
            categories_df.to_excel(writer, sheet_name='Categories', index=False)
            goals_df.to_excel(writer, sheet_name='NextGoals', index=False)
        return True
    except Exception as e:
        print(f"❌ Error writing Excel: {e}")
        return False

# ============================================================================
# TASKS ENDPOINTS
# ============================================================================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    tasks_df, _, _ = read_excel()
    
    # Convert DataFrame to list of dictionaries
    tasks = tasks_df.to_dict('records')
    
    # Handle NaN values and convert to proper types
    for task in tasks:
        task['id'] = int(task['id']) if pd.notna(task['id']) else None
        task['description'] = task['description'] if pd.notna(task['description']) else ''
        task['completed'] = bool(task['completed']) if pd.notna(task['completed']) else False
        task['date'] = str(task['date']) if pd.notna(task['date']) else ''
    
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.json
    tasks_df, categories_df, goals_df = read_excel()
    
    # Generate new ID
    new_id = int(tasks_df['id'].max() + 1) if not tasks_df.empty and pd.notna(tasks_df['id'].max()) else 1
    
    # Create new task
    new_task = {
        'id': new_id,
        'title': data.get('title', ''),
        'description': data.get('description', ''),
        'date': data.get('date', ''),
        'category': data.get('category', 'Self'),
        'completed': data.get('completed', False)
    }
    
    # Append to dataframe
    tasks_df = pd.concat([tasks_df, pd.DataFrame([new_task])], ignore_index=True)
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        return jsonify(new_task), 201
    else:
        return jsonify({'error': 'Failed to save task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task"""
    data = request.json
    tasks_df, categories_df, goals_df = read_excel()
    
    # Find task index
    task_index = tasks_df[tasks_df['id'] == task_id].index
    
    if len(task_index) == 0:
        return jsonify({'error': 'Task not found'}), 404
    
    # Update task
    idx = task_index[0]
    tasks_df.at[idx, 'title'] = data.get('title', tasks_df.at[idx, 'title'])
    tasks_df.at[idx, 'description'] = data.get('description', tasks_df.at[idx, 'description'])
    tasks_df.at[idx, 'date'] = data.get('date', tasks_df.at[idx, 'date'])
    tasks_df.at[idx, 'category'] = data.get('category', tasks_df.at[idx, 'category'])
    tasks_df.at[idx, 'completed'] = data.get('completed', tasks_df.at[idx, 'completed'])
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        updated_task = tasks_df.iloc[idx].to_dict()
        return jsonify(updated_task)
    else:
        return jsonify({'error': 'Failed to update task'}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    tasks_df, categories_df, goals_df = read_excel()
    
    # Remove task
    tasks_df = tasks_df[tasks_df['id'] != task_id]
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        return jsonify({'message': 'Task deleted successfully'})
    else:
        return jsonify({'error': 'Failed to delete task'}), 500

# ============================================================================
# CATEGORIES ENDPOINTS
# ============================================================================

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    _, categories_df, _ = read_excel()
    categories = categories_df['name'].tolist()
    return jsonify(categories)

@app.route('/api/categories', methods=['POST'])
def create_category():
    """Create a new category"""
    data = request.json
    tasks_df, categories_df, goals_df = read_excel()
    
    category_name = data.get('name', '')
    
    # Check if category already exists
    if category_name in categories_df['name'].values:
        return jsonify({'error': 'Category already exists'}), 400
    
    # Add new category
    new_category = pd.DataFrame({'name': [category_name]})
    categories_df = pd.concat([categories_df, new_category], ignore_index=True)
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        return jsonify({'name': category_name}), 201
    else:
        return jsonify({'error': 'Failed to save category'}), 500

@app.route('/api/categories/<category_name>', methods=['DELETE'])
def delete_category(category_name):
    """Delete a category"""
    tasks_df, categories_df, goals_df = read_excel()
    
    # Don't allow deleting default categories
    if category_name in ['Self', 'Job', 'PhD']:
        return jsonify({'error': 'Cannot delete default categories'}), 400
    
    # Remove category
    categories_df = categories_df[categories_df['name'] != category_name]
    
    # Reassign tasks from deleted category to 'Self'
    tasks_df.loc[tasks_df['category'] == category_name, 'category'] = 'Self'
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        return jsonify({'message': 'Category deleted successfully'})
    else:
        return jsonify({'error': 'Failed to delete category'}), 500

# ============================================================================
# NEXT GOALS ENDPOINTS
# ============================================================================

@app.route('/api/goals', methods=['GET'])
def get_goals():
    """Get all next goals"""
    _, _, goals_df = read_excel()
    goals = goals_df.to_dict('records')
    
    # Handle NaN values
    for goal in goals:
        goal['id'] = int(goal['id']) if pd.notna(goal['id']) else None
        goal['description'] = goal['description'] if pd.notna(goal['description']) else ''
    
    return jsonify(goals)

@app.route('/api/goals', methods=['POST'])
def create_goal():
    """Create a new goal"""
    data = request.json
    tasks_df, categories_df, goals_df = read_excel()
    
    # Generate new ID
    new_id = int(goals_df['id'].max() + 1) if not goals_df.empty and pd.notna(goals_df['id'].max()) else 1
    
    # Create new goal
    new_goal = {
        'id': new_id,
        'title': data.get('title', ''),
        'description': data.get('description', '')
    }
    
    # Append to dataframe
    goals_df = pd.concat([goals_df, pd.DataFrame([new_goal])], ignore_index=True)
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        return jsonify(new_goal), 201
    else:
        return jsonify({'error': 'Failed to save goal'}), 500

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    """Update an existing goal"""
    data = request.json
    tasks_df, categories_df, goals_df = read_excel()
    
    # Find goal index
    goal_index = goals_df[goals_df['id'] == goal_id].index
    
    if len(goal_index) == 0:
        return jsonify({'error': 'Goal not found'}), 404
    
    # Update goal
    idx = goal_index[0]
    goals_df.at[idx, 'title'] = data.get('title', goals_df.at[idx, 'title'])
    goals_df.at[idx, 'description'] = data.get('description', goals_df.at[idx, 'description'])
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        updated_goal = goals_df.iloc[idx].to_dict()
        return jsonify(updated_goal)
    else:
        return jsonify({'error': 'Failed to update goal'}), 500

@app.route('/api/goals/<int:goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    """Delete a goal"""
    tasks_df, categories_df, goals_df = read_excel()
    
    # Remove goal
    goals_df = goals_df[goals_df['id'] != goal_id]
    
    # Write to Excel
    if write_excel(tasks_df, categories_df, goals_df):
        return jsonify({'message': 'Goal deleted successfully'})
    else:
        return jsonify({'error': 'Failed to delete goal'}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Initialize Excel file on startup
    initialize_excel()
    
    print("🚀 Starting Flask Backend...")
    print("📊 Excel file:", EXCEL_FILE)
    print("🌐 Server running on http://localhost:5000")
    
    app.run(debug=True, port=5000)
