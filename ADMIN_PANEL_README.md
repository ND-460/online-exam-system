# Admin Panel - User Management System

## Overview
The Admin Panel provides comprehensive user management functionality for the online exam system. It allows administrators to view, manage, and monitor all users in the system with real-time notifications and statistics.

## Features

### 🔐 Authentication & Authorization
- Admin role verification
- Secure API endpoints with JWT authentication
- Protected routes and middleware

### 📊 Dashboard Statistics
- **Total Users**: Count of all registered users
- **Active Users**: Users with active status
- **Pending Users**: Users awaiting approval
- **Blocked Users**: Users with blocked status
- Real-time statistics updates

### 👥 User Management
- **View All Users**: Complete list of all registered users
- **User Information**: Name, email, role, and status
- **Status Management**: 
  - Approve pending users
  - Block/unblock users
  - Delete users (with confirmation)
- **Role-based Actions**: Different actions based on user roles

### 🔔 Notification System
- **Real-time Notifications**: Instant updates for user actions
- **Notification Types**:
  - Success (green): User approved, unblocked
  - Warning (yellow): User blocked
  - Error (red): User deleted
  - Info (blue): General information
- **Notification Features**:
  - Unread count badge
  - Click to mark as read
  - Clear all notifications
  - Timestamp display

### 🎨 User Interface
- **Modern Design**: Dark theme with glassmorphism effects
- **Responsive Layout**: Works on all screen sizes
- **Loading States**: Visual feedback during API calls
- **Interactive Elements**: Hover effects and animations
- **Toast Messages**: Success/error feedback

## API Endpoints

### User Management
- `GET /api/user/admin/users` - Get all users
- `PUT /api/user/admin/users/:userId/status` - Update user status
- `DELETE /api/user/admin/users/:userId` - Delete user
- `GET /api/user/admin/stats` - Get dashboard statistics

### User Status Options
- `pending` - New user awaiting approval
- `active` - Approved and active user
- `blocked` - Blocked user (cannot access system)

## User Actions

### Approve User
- Changes status from `pending` to `active`
- Sends success notification
- Updates statistics
- Shows toast confirmation

### Block User
- Changes status to `blocked`
- Sends warning notification
- Updates statistics
- Shows toast confirmation

### Unblock User
- Changes status from `blocked` to `active`
- Sends success notification
- Updates statistics
- Shows toast confirmation

### Delete User
- Removes user from database
- Deletes associated student/teacher records
- Sends error notification
- Updates statistics
- Shows confirmation dialog

## Security Features

### Admin Protection
- Only users with `admin` role can access
- JWT token verification
- API endpoint protection
- Self-deletion prevention

### Data Validation
- Input validation on all endpoints
- Status enum validation
- User existence checks
- Error handling and logging

## Usage Instructions

### Accessing Admin Panel
1. Login with admin credentials
2. Navigate to `/admin` route
3. Dashboard loads automatically

### Managing Users
1. View user list in the "Manage Users" table
2. Use action buttons for each user:
   - **Approve**: For pending users
   - **Block**: For active users
   - **Unblock**: For blocked users
   - **Delete**: For any user (except self)

### Viewing Notifications
1. Click the bell icon in the top navigation
2. View all notifications with timestamps
3. Click notifications to mark as read
4. Use "Clear All" to remove all notifications

### Refreshing Data
1. Click the "Refresh" button in the user management section
2. Data updates automatically after user actions
3. Statistics refresh after status changes

## Technical Implementation

### Frontend
- **React**: Component-based architecture
- **Zustand**: State management
- **Axios**: HTTP client
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **React Toastify**: Toast notifications

### Backend
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **JWT**: Authentication
- **Bcrypt**: Password hashing

### Notification Service
- **Singleton Pattern**: Global notification management
- **Observer Pattern**: Real-time updates
- **Type-based Notifications**: Different notification types
- **Persistent Storage**: Notifications persist during session

## File Structure
```
frontend/src/
├── pages/admin/
│   └── AdminDashboard.jsx
├── utils/
│   └── notificationService.js
└── store/
    └── authStore.js

backend/
├── routes/
│   └── user.js
├── model/
│   └── User.js
└── middleware/
    └── auth.js
```

## Future Enhancements
- Real-time WebSocket notifications
- User activity logs
- Bulk user operations
- Advanced filtering and search
- Export user data
- Email notifications for user actions
- Audit trail for admin actions

## Support
For issues or questions regarding the admin panel, please contact the development team or create an issue in the project repository.
