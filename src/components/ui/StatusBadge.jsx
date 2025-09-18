import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, type = 'attendance' }) => {
  const configs = {
    attendance: {
      success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
      leave: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' }
    },
    api: {
      success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
      timeout: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' }
    }
  };

  const config = configs[type]?.[status] || configs.attendance.success;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

export default StatusBadge;