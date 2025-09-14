import React from 'react';
import { FileX, Users, Calendar, FileText, Building2, Bot, UserCheck } from 'lucide-react';

const EmptyState = ({ 
  type = 'default', 
  title = 'No Data Found', 
  description = 'There is no data to display at the moment.',
  className = '' 
}) => {
  const getIcon = () => {
    const iconProps = { className: "w-12 h-12 text-gray-400 mx-auto mb-4" };
    
    switch (type) {
      case 'users': return <Users {...iconProps} />;
      case 'brands': return <Building2 {...iconProps} />;
      case 'schedule': return <Calendar {...iconProps} />;
      case 'leave': return <FileText {...iconProps} />;
      case 'bots': return <Bot {...iconProps} />;
      case 'agents': return <UserCheck {...iconProps} />;
      default: return <FileX {...iconProps} />;
    }
  };

  return (
    <div className={`text-center py-8 ${className}`}>
      {getIcon()}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default EmptyState;