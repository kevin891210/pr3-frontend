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
    isHalfDay: false,
    handoverList: ''
  });
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLeaveTypes();
    }
  }, [isOpen]);

  const loadLeaveTypes = async () => {
    try {
      const response = await apiClient.getAgentLeaveTypes();
      const typesData = response.data || response;
      
      // Load agent's leave balance to filter out 0-day allowances
      const memberId = localStorage.getItem('member_id');
      let balanceData = [];
      if (memberId) {
        try {
          const balanceResponse = await apiClient.getLeaveBalance(memberId, new Date().getFullYear());
          balanceData = balanceResponse.data || balanceResponse;
          setLeaveBalance(Array.isArray(balanceData) ? balanceData : []);
        } catch (balanceError) {
          console.warn('Failed to load leave balance:', balanceError);
        }
      }
      
      // Filter out leave types with 0 days allowance
      let availableTypes = Array.isArray(typesData) ? typesData : [];
      if (Array.isArray(balanceData) && balanceData.length > 0) {
        availableTypes = typesData.filter(type => {
          const balance = balanceData.find(b => b.leave_type_id === type.id);
          return balance ? balance.total_days > 0 : true; // Show if no balance data or has allowance
        });
      }
      
      setLeaveTypes(availableTypes);
      if (availableTypes.length > 0) {
        setFormData(prev => ({ ...prev, type: availableTypes[0].code || availableTypes[0].id }));
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
      const memberId = localStorage.getItem('member_id');
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const actualDays = formData.isHalfDay ? 0.5 : days;
      
      // Check if handover list is required
      const handoverRequired = selectedType?.handover_required_days > 0 && actualDays > selectedType.handover_required_days;
      if (handoverRequired && !formData.handoverList.trim()) {
        alert(`Handover list is required for leave requests exceeding ${selectedType.handover_required_days} days.`);
        setLoading(false);
        return;
      }
      
      const leaveData = {
        member_id: memberId,
        leave_type_id: selectedType?.id || formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        days: actualDays,
        reason: formData.reason,
        ...(handoverRequired && { handover_list: formData.handoverList })
      };
      
      await apiClient.submitLeaveRequest(leaveData);
      alert('Leave request submitted successfully!');
      onClose();
      setFormData({ type: leaveTypes[0]?.code || '', startDate: '', endDate: '', reason: '', isHalfDay: false, handoverList: '' });
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
              {leaveTypes.map(type => {
                const balance = leaveBalance.find(b => b.leave_type_id === type.id);
                const remaining = balance?.remaining_days || 0;
                return (
                  <option key={type.id} value={type.code || type.id}>
                    {type.name} ({remaining} days remaining)
                  </option>
                );
              })}
            </select>
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

          {(() => {
            const selectedType = leaveTypes.find(type => (type.code || type.id) === formData.type);
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            const days = formData.startDate && formData.endDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 0;
            const actualDays = formData.isHalfDay ? 0.5 : days;
            const handoverRequired = selectedType?.handover_required_days > 0 && actualDays > selectedType.handover_required_days;
            
            return handoverRequired ? (
              <div>
                <label className="block text-sm font-medium mb-2 text-orange-600">
                  Handover List (Required for >{selectedType.handover_required_days} days)
                </label>
                <textarea
                  value={formData.handoverList}
                  onChange={(e) => setFormData(prev => ({ ...prev, handoverList: e.target.value }))}
                  className="w-full p-3 border border-orange-300 rounded-md h-24 resize-none text-base"
                  placeholder="Please provide detailed handover instructions for your responsibilities"
                  required
                />
              </div>
            ) : null;
          })()}

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