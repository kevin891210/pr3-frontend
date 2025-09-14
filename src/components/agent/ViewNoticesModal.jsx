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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            All Notices
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No notices available</div>
          ) : (
            <div className="space-y-4">
              {notices.map(notice => (
                <Card key={notice.id} className={notice.unread ? 'border-blue-200 bg-blue-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{notice.title}</h3>
                        {notice.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <Badge className={getPriorityColor(notice.priority)}>
                        {notice.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{notice.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {notice.time}
                      </div>
                      {notice.unread && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsRead(notice.id)}
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