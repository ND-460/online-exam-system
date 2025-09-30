// Notification Service for Admin Panel
class NotificationService {
    constructor() {
        this.notifications = [];
        this.listeners = [];
    }

    // Add a new notification
    addNotification(message, type = 'info', data = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            data,
            read: false
        };

        this.notifications.unshift(notification);

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        // Notify listeners
        this.notifyListeners();

        return notification;
    }

    // Get all notifications
    getNotifications() {
        return this.notifications;
    }

    // Get unread notifications count
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    // Mark notification as read
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.notifyListeners();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.notifyListeners();
    }

    // Clear all notifications
    clearAll() {
        this.notifications = [];
        this.notifyListeners();
    }

    // Remove a specific notification
    removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.notifyListeners();
    }

    // Subscribe to notification changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.notifications));
    }

    // User management specific notifications
    userApproved(userName) {
        return this.addNotification(
            `User ${userName} has been approved and is now active`,
            'success',
            { action: 'user_approved', userName }
        );
    }

    userBlocked(userName) {
        return this.addNotification(
            `User ${userName} has been blocked`,
            'warning',
            { action: 'user_blocked', userName }
        );
    }

    userUnblocked(userName) {
        return this.addNotification(
            `User ${userName} has been unblocked and is now active`,
            'success',
            { action: 'user_unblocked', userName }
        );
    }

    userDeleted(userName) {
        return this.addNotification(
            `User ${userName} has been deleted from the system`,
            'error',
            { action: 'user_deleted', userName }
        );
    }

    userRegistered(userName) {
        return this.addNotification(
            `New user ${userName} has registered and is pending approval`,
            'info',
            { action: 'user_registered', userName }
        );
    }

    statusUpdated(userName, oldStatus, newStatus) {
        return this.addNotification(
            `User ${userName} status changed from ${oldStatus} to ${newStatus}`,
            'info',
            { action: 'status_updated', userName, oldStatus, newStatus }
        );
    }
}

// Create a singleton instance
const notificationService = new NotificationService();

export default notificationService;
