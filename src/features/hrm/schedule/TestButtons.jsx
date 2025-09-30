import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Upload, Plus } from 'lucide-react';

const TestButtons = () => {
  return (
    <div className="space-y-2 p-4 border rounded">
      <h3>Test Buttons</h3>
      <Button className="w-full flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Assign Shift
      </Button>
      
      <Button className="w-full flex items-center gap-2" variant="outline">
        <Calendar className="w-4 h-4" />
        Monthly Schedule
      </Button>
      
      <Button className="w-full flex items-center gap-2" variant="outline">
        <Upload className="w-4 h-4" />
        Import CSV
      </Button>
    </div>
  );
};

export default TestButtons;