// app/notifications/page.tsx
'use client';

import { useState } from 'react';
import { useGetAllNotificationsQuery, useMarkAllAsReadMutation } from '@/redux/api/notificationApi';
import { Bell, Check, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const limit = 20;
  
  const { data: response, isLoading, refetch } = useGetAllNotificationsQuery(
    { page, limit },
    { refetchOnMountOrArgChange: true }
  );
  
  const [markAllAsRead] = useMarkAllAsReadMutation();
  
  const notifications = response || [];
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => n.status === 'unread')
    : notifications;
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-10 pr-4 py-2 border rounded-lg bg-white appearance-none"
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
            </select>
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div> */}
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  notification.status === 'unread' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.status === 'unread' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          notification.status === 'unread'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    {notification && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {/* {notification.conversationId && (
                          <button
                            onClick={() => {
                              // Navigate to chat
                              // router.push(`/chat/${notification.metadata.conversationId}`);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Open conversation
                          </button>
                        )} */}
                        
                        {notification.from && (
                          <span className="text-sm text-gray-500">
                            From: {notification.from}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'You have no unread notifications' 
                : 'You have no notifications yet'}
            </p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {notifications.length >= limit && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}