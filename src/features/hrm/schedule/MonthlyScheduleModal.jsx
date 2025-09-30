import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import SearchableSelect from '@/components/ui/searchable-select';
import { Calendar, Plus, Trash2, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const MonthlyScheduleModal = ({ 
  open, 
  onOpenChange, 
  brands, 
  workspaceMembers, 
  shiftTemplates, 
  onBrandChange, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    brand_id: '',
    member_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    schedules: []
  });

  const [selectedDates, setSelectedDates] = useState([]);
  const [bulkTemplate, setBulkTemplate] = useState('');

  useEffect(() => {
    if (open) {
      const now = new Date();
      setFormData({
        brand_id: '',
        member_id: '',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        schedules: []
      });
      setSelectedDates([]);
      setBulkTemplate('');
    }
  }, [open]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getMonthDates = () => {
    const daysInMonth = getDaysInMonth(formData.year, formData.month);
    const dates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(formData.year, formData.month - 1, day);
      dates.push({
        day,
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    return dates;
  };

  const handleDateToggle = (dateStr) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleBulkAssign = () => {
    if (!bulkTemplate || selectedDates.length === 0) return;

    const newSchedules = selectedDates.map(date => ({
      date,
      template_id: bulkTemplate,
      id: `temp-${Date.now()}-${Math.random()}`
    }));

    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules.filter(s => !selectedDates.includes(s.date)), ...newSchedules]
    }));

    setSelectedDates([]);
    setBulkTemplate('');
  };

  const handleRemoveSchedule = (scheduleId) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== scheduleId)
    }));
  };

  const handleSubmit = () => {
    if (!formData.brand_id || !formData.member_id || formData.schedules.length === 0) {
      alert('Please fill in all required fields and add at least one schedule.');
      return;
    }

    const assignments = formData.schedules.map(schedule => ({
      member_id: formData.member_id,
      shift_template_id: schedule.template_id,
      date: schedule.date
    }));

    onSubmit(assignments);
  };

  const monthDates = getMonthDates();
  const scheduledDates = formData.schedules.map(s => s.date);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Monthly Schedule Assignment"
      size="lg"
      className="max-h-[90vh] w-full max-w-4xl"
      footer={
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={formData.schedules.length === 0}>
            Create {formData.schedules.length} Assignments
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Brand *</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.brand_id}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, brand_id: e.target.value, member_id: '' }));
                onBrandChange(e.target.value);
              }}
              required
            >
              <option value="">Select Brand</option>
              {brands.filter(brand => brand.is_active).map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Member *</label>
            <SearchableSelect
              value={formData.member_id}
              onChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}
              placeholder="Select Member"
              searchPlaceholder="Search members..."
              disabled={!formData.brand_id}
              options={workspaceMembers.map(member => ({
                value: member.id,
                label: `${member.name || member.username || member.email || member.id} (${member.role || 'Member'})`
              }))}
            />
          </div>
        </div>

        {/* Month/Year Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <Input
              type="number"
              min="2020"
              max="2030"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.month}
              onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Assignment */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Bulk Assignment</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select
                className="flex-1 p-2 border rounded-md min-w-0"
                value={bulkTemplate}
                onChange={(e) => setBulkTemplate(e.target.value)}
              >
                <option value="">Select Template</option>
                {shiftTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.start_time}-{template.end_time})
                  </option>
                ))}
              </select>
              <Button 
                onClick={handleBulkAssign}
                disabled={!bulkTemplate || selectedDates.length === 0}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1" />
                Assign to {selectedDates.length} days
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Select dates below, choose a template, then click "Assign" to bulk assign shifts.
            </p>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <div className="sticky top-0 bg-white pb-2">
          <h3 className="font-medium mb-3">Select Dates</h3>
          <div className="grid grid-cols-7 gap-1 mb-4 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
            {monthDates.map(({ day, date, dayName, isWeekend }) => {
              const isSelected = selectedDates.includes(date);
              const isScheduled = scheduledDates.includes(date);
              
              return (
                <button
                  key={date}
                  onClick={() => handleDateToggle(date)}
                  className={`
                    p-2 text-sm border rounded transition-colors min-h-[40px] flex items-center justify-center
                    ${isSelected ? 'bg-blue-500 text-white border-blue-500' : ''}
                    ${isScheduled && !isSelected ? 'bg-green-100 border-green-300' : ''}
                    ${isWeekend && !isSelected && !isScheduled ? 'bg-gray-50' : ''}
                    ${!isSelected && !isScheduled ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-50 border rounded"></div>
              <span>Weekend</span>
            </div>
          </div>
        </div>

        {/* Current Schedules */}
        {formData.schedules.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Scheduled Shifts ({formData.schedules.length})</h3>
            <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
              {formData.schedules.map(schedule => {
                const template = shiftTemplates.find(t => t.id === schedule.template_id);
                return (
                  <div key={schedule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {schedule.date} - {template?.name} ({template?.start_time}-{template?.end_time})
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveSchedule(schedule.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MonthlyScheduleModal;