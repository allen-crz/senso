import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/services/api';
import { Database } from '@/integrations/supabase/types';
import { toast } from './use-toast';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationPermission {
  permission: 'default' | 'granted' | 'denied';
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [browserPermission, setBrowserPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "This browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    
    if (permission === 'granted') {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive browser notifications.",
      });
      return true;
    } else {
      toast({
        title: "Notifications Denied",
        description: "You can enable notifications in your browser settings.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }, []);

  // Create notification in database
  const createNotification = useCallback(async (
    type: string,
    title: string,
    message: string,
    data?: any
  ) => {
    if (!user?.id) return;

    try {
      // For now, just send browser notification since we don't have the backend endpoint
      // In a full implementation, you'd call api.createNotification here
      
      // Send browser notification if permission granted
      if (browserPermission === 'granted') {
        sendBrowserNotification(title, { body: message });
      }
      
      // Create a mock notification for the UI
      const mockNotification: Notification = {
        id: Date.now().toString(),
        user_id: user.id,
        type,
        title,
        message,
        data,
        delivery_method: 'push',
        sent_at: null,
        delivered_at: null,
        read_at: null,
        clicked_at: null,
        status: 'sent',
        error_message: null,
        retry_count: 0,
        created_at: new Date().toISOString()
      };

      setNotifications(prev => [mockNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      return mockNotification;
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }, [user?.id, browserPermission, sendBrowserNotification]);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await api.getNotifications({ limit: 50 });
      const notifications = Array.isArray(data) ? data : [];
      
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await api.markNotificationRead(notificationId);

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user?.id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await api.markAllNotificationsRead();

      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => 
        !n.read_at ? { ...n, read_at: now } : n
      ));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user?.id]);

  // Test notification function for debugging
  const sendTestNotification = useCallback(() => {
    createNotification(
      'test',
      'Test Notification',
      'This is a test notification to verify the system is working.'
    );
  }, [createNotification]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    fetchNotifications();

    // Optimized polling - reduced frequency to improve performance
    // In a full implementation, you'd set up WebSocket or SSE connections
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 120000); // Poll every 2 minutes instead of 30 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    browserPermission,
    requestPermission,
    createNotification,
    markAsRead,
    markAllAsRead,
    sendBrowserNotification,
    sendTestNotification,
    refreshNotifications: fetchNotifications
  };
};