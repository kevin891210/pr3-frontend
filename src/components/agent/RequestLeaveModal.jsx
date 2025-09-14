import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Calendar } from 'lucide-react';
import apiClient from '../../services/api';

const RequestLeaveModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLeaveTypes();
    }
  }, [isOpen]);

  const loadLeaveTypes = async () => {
    try {
      const response = await apiClient.getLeaveTypes();
      const typesData = response.data || response;
      setLeaveTypes(Array.isArray(typesData) ? typesData : []);
      if (typesData.length > 0) {
        setFormData(prev => ({ ...prev, type: typesData[0].code || typesData[0].id }));
      }
    } catch (error) {
      console.error('Failed to load leave types:', error);
      setLeaveTypes([
        { id: 'annual', code: 'ANNUAL', name: 'Annual Leave' },
        { id: 'sick', code: 'SICK', name: 'Sick Leave' },
        { id: 'personal', code: 'PERSONAL', name: 'Personal Leave' }
      ]);
      setFormData(prev => ({ ...prev, type: 'annual' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format data for API
      const selectedType = leaveTypes.find(type => (type.code || type.id) === formData.type);
      const leaveData = {
        userId: null, // Will be set by backend based on auth token
        typeId: selectedType?.id || formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: '09:00',
        endTime: '18:00',
        timezone: 'Asia/Taipei',
        reason: formData.reason,
        isHalfDay: formData.isHalfDay
      };
      
      await apiClient.submitLeaveRequest(leaveData);
      alert('Leave request submitted successfully!');
      onClose();
      setFormData({ type: leaveTypes[0]?.code || '', startDate: '', endDate: '', reason: '', isHalfDay: false });
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      alert('Failed to submit leave request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Request Leave</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Leave Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.code || type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isHalfDay: e.target.checked }))}
              />
              <span className="text-sm">Half Day</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full p-2 border rounded-md h-20 resize-none"
              placeholder="Please provide a reason for your leave request"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestLeaveModal;