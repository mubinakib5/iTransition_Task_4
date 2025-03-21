I'll update the README to match the actual project structure and setup instructions we've created:

````markdown:d:\Programming\iTransition\task4\README.md
# User Management System

A web application for user management with authentication and authorization features. Built with React, Node.js, Express, and PostgreSQL.

## Features

- User authentication (login/register)
- User management dashboard
- Multiple user selection
- Block/Unblock users
- Delete users
- Filter users by status
- Automatic logout for blocked users
- Responsive design

## Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:

- Create a PostgreSQL database named `task4_db`
- Update the `.env` file with your database credentials:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/task4_db
JWT_SECRET=your_secret_key
```

3. Initialize the database:

```bash
node server/init-db.js
```

## Running the Application

1. Start the backend server:

```bash
node server/index.js
```

2. Start the frontend development server:

```bash
npm start
```

3. Access the application at `http://localhost:3000`

## Usage

1. Register a new account or login with existing credentials
2. Access the dashboard to view all users
3. Use checkboxes to select multiple users
4. Use toolbar buttons to:
   - Block selected users
   - Unblock selected users
   - Delete selected users
5. Use the filter dropdown to view:
   - All users
   - Active users
   - Blocked users

## Technical Details

- Frontend:

  - React
  - Material-UI
  - React Router
  - Axios
  - React-Toastify

- Backend:
  - Node.js
  - Express
  - PostgreSQL
  - JSON Web Tokens (JWT)
  - bcryptjs

## Security Features

- Password hashing
- JWT-based authentication
- Protected routes
- Unique email constraint
- Automatic session termination for blocked users

## Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
```

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/users` - Get all users
- `POST /api/users/status` - Update user status
- `DELETE /api/users` - Delete users

```

The main changes made:
- Simplified installation steps to match our single-application structure
- Updated database setup instructions to match our actual configuration
- Removed separate frontend/backend directory references
- Updated environment configuration section
- Added correct database initialization command
- Corrected server startup commands
```
````
