import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, Clock } from 'lucide-react';
import apiClient from '../../services/api';

const ViewNoticesModal = ({ isOpen, onClose }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotices();
    }
  }, [isOpen]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setNotices([
        {
          id: 1,
          title: 'System Maintenance Notice',
          content: 'The system will undergo maintenance on January 20th from 2:00 AM to 4:00 AM. Please save your work before this time.',
          time: '2024-01-15 10:00',
          unread: true,
          priority: 'high'
        },
        {
          id: 2,
          title: 'New Policy Announcement',
          content: 'We are implementing new work-from-home policies effective February 1st. Please review the updated guidelines.',
          time: '2024-01-14 15:30',
          unread: false,
          priority: 'medium'
        },
        {
          id: 3,
          title: 'Holiday Schedule Update',
          content: 'The holiday schedule for 2024 has been updated. Please check your calendar for any changes.',
          time: '2024-01-13 09:15',
          unread: false,
          priority: 'low'
        }
      ]);
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (noticeId) => {
    setNotices(prev => 
      prev.map(notice => 
        notice.id === noticeId ? { ...notice, unread: false } : notice
      )
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            All Notices
          </h2>
          <Button variant="outline" size="sm" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading...
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No notices available
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map(notice => (
                <Card key={notice.id} className={`shadow-sm ${notice.unread ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex items-start gap-2 flex-1">
                        <h3 className="font-medium text-gray-900 flex-1">{notice.title}</h3>
                        {notice.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                        )}
                      </div>
                      <Badge className={`${getPriorityColor(notice.priority)} self-start`}>
                        {notice.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{notice.content}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {notice.time}
                      </div>
                      {notice.unread && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRead(notice.id)}
                          className="self-start sm:self-auto"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewNoticesModal;