import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AgentCard from './AgentCard';
import EmptyState from '../ui/empty-state';

const AgentGrid = ({ agents, type, title, icon: Icon, maxCols = 2, collapsible = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title} ({agents.length})
          </div>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {agents.length === 0 ? (
            <EmptyState 
              type={type} 
              title="No Data" 
              description="No agent data available." 
              className="py-4" 
            />
          ) : (
            <div className={`grid gap-3 ${
              maxCols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 
              maxCols === 3 ? 'grid-cols-1 md:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2'
            }`}>
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} type={type} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AgentGrid;