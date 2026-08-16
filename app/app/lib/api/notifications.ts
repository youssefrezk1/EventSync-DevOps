import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Create axios instance with auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface Notification {
  _id: string;
  recipientType: string;
  recipientId: string;
  type: 'workshop_request' | 'workshop_status' | 'new_event' | 'event_reminder' | 'new_partner' | 'vendor_request';
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

// Get all notifications for the logged-in user
export const getNotifications = async (): Promise<NotificationsResponse> => {
  const response = await axios.get(`${API_BASE_URL}/api/notifications`, getAuthHeaders());
  return response.data;
};

// Get unread count
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, getAuthHeaders());
  return response.data;
};

// Mark specific notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, getAuthHeaders());
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/api/notifications/read-all`, {}, getAuthHeaders());
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, getAuthHeaders());
};