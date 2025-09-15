import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Bell, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const NoticeWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestNotices();
  }, []);

  const loadLatestNotices = async () => {
    try {
      const response = await apiClient.getNotices({ limit: 5, status: 'published' });
      const data = response.data || response;
      setNotices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load notices failed:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const getActiveNotices = () => {
    if (!Array.isArray(notices)) return [];
    const now = new Date();
    return notices.filter(notice => {
      const startTime = new Date(notice.startTime);
      const endTime = new Date(notice.endTime);
      return now >= startTime && now <= endTime && notice.status === 'published';
    });
  };

  const activeNotices = getActiveNotices();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Latest Notices
        </CardTitle>
        <button
          onClick={() => navigate('/notice')}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View All
          <ExternalLink className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : activeNotices.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No active notices</p>
        ) : (
          <div className="space-y-3">
            {activeNotices.slice(0, 3).map(notice => (
              <div key={notice.id} className="border-l-4 border-blue-500 pl-3 py-2">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {notice.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {notice.content}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(notice.startTime).toLocaleDateString()} - {new Date(notice.endTime).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoticeWidget;