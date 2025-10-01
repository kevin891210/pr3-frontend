import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Calendar } from 'lucide-react';
import apiClient from '../../services/api';

const RequestLeaveModal = ({ isOpen, onClose, leaveBalance = [] }) => {
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLeaveTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    // 根據 leaveBalance 過濾出可用的請假類型（總天數 > 0）
    if (Array.isArray(leaveBalance) && leaveBalance.length > 0) {
      const validBalances = leaveBalance.filter(balance => balance.total_days > 0);
      const validTypeIds = new Set(validBalances.map(balance => balance.leave_type_id));

      const filtered = leaveTypes.filter(type => validTypeIds.has(type.id));
      setAvailableLeaveTypes(filtered);

      // 設定預設選擇第一個可用的請假類型
      if (filtered.length > 0 && !formData.type) {
        setFormData(prev => ({ ...prev, type: filtered[0].code || filtered[0].id }));
      }
    } else {
      setAvailableLeaveTypes(leaveTypes);
    }
  }, [leaveTypes, leaveBalance]);

  const loadLeaveTypes = async () => {
    try {
      const response = await apiClient.getAgentLeaveTypes();
      const typesData = response.data || response;
      setLeaveTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error('Failed to load leave types:', error);
      setLeaveTypes([
        { id: 'annual', code: 'ANNUAL', name: 'Annual Leave' },
        { id: 'sick', code: 'SICK', name: 'Sick Leave' },
        { id: 'personal', code: 'PERSONAL', name: 'Personal Leave' }
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Format data for API
      const selectedType = availableLeaveTypes.find(type => (type.code || type.id) === formData.type);
      const memberId = localStorage.getItem('member_id');
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const leaveData = {
        member_id: memberId,
        leave_type_id: selectedType?.id || formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days: formData.isHalfDay ? 0.5 : days,
        reason: formData.reason
      };

      await apiClient.submitLeaveRequest(leaveData);
      alert('Leave request submitted successfully!');
      onClose();
      setFormData({ type: availableLeaveTypes[0]?.code || '', startDate: '', endDate: '', reason: '', isHalfDay: false });
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      alert('Failed to submit leave request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold">Request Leave</h2>
          <Button variant="outline" size="sm" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Leave Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-3 border rounded-md text-base"
              required
            >
              <option value="">Select Leave Type</option>
              {availableLeaveTypes.map(type => (
                <option key={type.id} value={type.code || type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {availableLeaveTypes.length === 0 && (
              <p className="text-sm text-red-500 mt-2">
                No leave types available. Please contact your administrator.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-12 text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-12 text-base"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isHalfDay: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Half Day Leave</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full p-3 border rounded-md h-24 resize-none text-base"
              placeholder="Please provide a reason for your leave request"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 h-12">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestLeaveModal;