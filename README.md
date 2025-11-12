# 📋 To-Do Manager - Personal Task Management App

A modern, responsive web application for managing personal tasks organized by categories and weeks. Built with React, Node.js/Express, and Excel file storage.

## ✨ Features

- **📊 Category Organization**: Three default categories (Self, Job, PhD) with ability to add custom ones
- **📅 Week-Based Grouping**: Tasks automatically organized by week number
- **🎯 Next Goals Section**: Track future objectives and long-term goals
- **🔍 Search & Filter**: Quick search and category filtering
- **✅ Task Management**: Full CRUD operations (Create, Read, Update, Delete)
- **💾 Excel Storage**: All data persisted in a single `tasks.xlsx` file
- **🎨 Clean UI**: Minimalist design with smooth transitions using Tailwind CSS
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0
- **Tailwind CSS** 3.3.0
- **Axios** for API calls
- **Lucide React** for icons

### Backend
- **Node.js** with Express 4.18.2
- **xlsx** library for Excel file operations
- **CORS** enabled for cross-origin requests

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Step 1: Clone or Download the Project

```bash
# Navigate to the project directory
cd /path/to/todo-manager
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

You'll need to run both the backend and frontend servers.

### Terminal 1: Start the Backend Server

```bash
cd backend
npm start
```

The backend server will start on **http://localhost:5000**

Output:
```
✅ Backend server running on http://localhost:5000
📊 Excel file location: /path/to/backend/tasks.xlsx
```

### Terminal 2: Start the Frontend Server

```bash
cd frontend
npm start
```

The frontend will automatically open in your browser at **http://localhost:3000**

## 📁 Project Structure

```
todo-manager/
├── backend/
│   ├── server.js              # Express server with API endpoints
│   ├── package.json           # Backend dependencies
│   └── tasks.xlsx            # Data storage (auto-created)
│
├── frontend/
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Tailwind CSS styles
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── postcss.config.js     # PostCSS configuration
│
└── create_sample_excel.py    # Script to generate sample data
```

## 📊 Excel File Structure

The `tasks.xlsx` file contains three sheets:

### 1. Tasks Sheet
| Column | Type | Description |
|--------|------|-------------|
| id | Number | Unique task identifier |
| title | String | Task title |
| description | String | Optional task description |
| date | String | Task date (YYYY-MM-DD format) |
| category | String | Category name |
| completed | Boolean | Completion status |
| week | Number | Week number (auto-calculated) |

### 2. Categories Sheet
| Column | Type | Description |
|--------|------|-------------|
| id | Number | Unique category identifier |
| name | String | Category name |

### 3. NextGoals Sheet
| Column | Type | Description |
|--------|------|-------------|
| id | Number | Unique goal identifier |
| title | String | Goal title |
| description | String | Optional goal description |
| category | String | Category name |
| completed | Boolean | Completion status |

## 🎯 Usage Guide

### Adding a Task
1. Click the **"Add Task"** button in the top bar
2. Fill in the task details:
   - Title (required)
   - Description (optional)
   - Date (defaults to today)
   - Category (select from dropdown)
3. Click **"Add Task"** to save

### Editing a Task
1. Click the **edit icon** (pencil) on any task
2. Modify the details in the modal
3. Click **"Update Task"** to save changes

### Completing a Task
- Click the **checkbox** next to any task to toggle its completion status
- Completed tasks are visually distinct with strikethrough text

### Deleting a Task
- Click the **trash icon** on any task to delete it permanently

### Managing Categories
1. Click **"+ Category"** in the top bar
2. Enter a category name
3. Click **"Add Category"**
4. Custom categories can be deleted (default categories cannot)

### Next Goals
1. Click the **"+"** icon in the Next Goals section
2. Add goal title, description, and category
3. Toggle completion and manage like regular tasks

### Search & Filter
- Use the **search bar** to find tasks by title or description
- Use the **category dropdown** to filter by specific category
- Select "All Categories" to view everything

## 🔧 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `DELETE /api/categories/:id` - Delete a category

### Next Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Update a goal
- `DELETE /api/goals/:id` - Delete a goal

### All Data
- `GET /api/data` - Get all tasks, categories, and goals in one request

## 🎨 Customization

### Changing Colors
Edit `frontend/src/App.js` to modify the color scheme. The app uses Tailwind CSS classes:
- Primary color: `bg-blue-600`, `text-blue-600`
- Secondary color: `bg-purple-600`, `text-purple-600`
- Success color: `bg-green-500`, `text-green-500`

### Changing Port Numbers
**Backend**: Edit `PORT` in `backend/server.js` (default: 5000)
**Frontend**: Set `PORT` environment variable or edit `.env` file

### Adding New Features
The code is modular and well-commented. Key files:
- `backend/server.js` - Add new API endpoints
- `frontend/src/App.js` - Add new UI components and features

## 🐛 Troubleshooting

### Backend won't start
- Ensure port 5000 is not in use: `lsof -ti:5000 | xargs kill`
- Verify all dependencies are installed: `npm install`

### Frontend can't connect to backend
- Check that backend is running on port 5000
- Verify CORS is enabled in `server.js`
- Check API_URL in `frontend/src/App.js`

### Excel file errors
- Ensure the backend has write permissions in its directory
- Delete `tasks.xlsx` to regenerate with fresh data
- Check for invalid data in Excel file (dates, IDs, etc.)

### Tasks not grouping by week
- Verify task dates are in valid format (YYYY-MM-DD)
- Check that week number calculation in backend is working
- Inspect browser console for JavaScript errors

## 📝 Sample Data

Run the included Python script to generate sample data:

```bash
python3 create_sample_excel.py
```

This creates a `tasks.xlsx` file with example tasks, categories, and goals.

## 🚀 Production Deployment

### Backend
1. Set environment variables for production
2. Use process manager like PM2: `pm2 start server.js`
3. Configure reverse proxy (nginx) if needed
4. Ensure secure file permissions for `tasks.xlsx`

### Frontend
1. Build the production bundle: `npm run build`
2. Serve the `build` folder with a static server
3. Configure API_URL to point to production backend

## 🔒 Security Notes

- This app stores data in a local Excel file (not recommended for production)
- No authentication/authorization implemented
- For production use, consider:
  - Adding user authentication
  - Using a proper database (PostgreSQL, MongoDB)
  - Implementing data encryption
  - Adding input validation and sanitization

## 📄 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to fork, modify, and improve this project!

## 💡 Future Enhancements

- [ ] User authentication system
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Task priorities and tags
- [ ] Due date reminders
- [ ] Calendar view
- [ ] Export to PDF/CSV
- [ ] Dark mode
- [ ] Task notes and attachments
- [ ] Recurring tasks
- [ ] Analytics dashboard

## 📧 Support

For issues or questions, please check the troubleshooting section above.

---

**Built with ❤️ using React, Node.js, and Excel**
