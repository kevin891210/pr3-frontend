import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

const AgentCard = ({ agent, type }) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'service':
        return {
          bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
          badgeColor: 'bg-green-100 text-green-800',
          iconColor: 'text-green-600',
          icon: Wifi,
          status: 'On Service'
        };
      case 'online':
        return {
          bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
          badgeColor: 'bg-blue-100 text-blue-800',
          iconColor: 'text-blue-600',
          icon: Wifi,
          status: 'On Line'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: AlertCircle,
          status: 'Warning'
        };
      case 'offline':
        return {
          bgColor: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
          badgeColor: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-600',
          icon: WifiOff,
          status: 'Offline'
        };
      default:
        return {
          bgColor: 'bg-white border-gray-200',
          badgeColor: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-600',
          icon: WifiOff,
          status: 'Unknown'
        };
    }
  };



  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-lg border transition-colors cursor-pointer ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs font-medium">
            {getInitials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="font-medium text-sm text-gray-900">{agent.name}</div>
      </div>
    </div>
  );
};

export default AgentCard;