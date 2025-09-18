import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Filter, Calendar, Download, Eye, 
  CheckCircle, XCircle, Clock, AlertCircle 
} from 'lucide-react';
import { apiClient } from '@/services/api.js';
import { useAuthStore } from '@/store/authStore.jsx';

const AttendanceRecords = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    workspace: '',
    employee: '',
    dateRange: { start: '', end: '' },
    status: ''
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendanceRecords();
  }, []);

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      const response = await apiClient.getAttendanceRecords(workspaceId, {
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
        employee_name: filters.employee,
        status: filters.status
      });
      
      if (response.data && Array.isArray(response.data)) {
        setRecords(response.data);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      setError(error.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadAttendanceRecords();
  };

  const handleExportData = async () => {
    try {
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      const response = await apiClient.exportAttendanceProof(workspaceId, {
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
        employee_name: filters.employee,
        status: filters.status
      });
      
      // Handle file download
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to export attendance data:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    leave: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' }
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3" />
        {t(`attendance.status.${status}`)}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('attendance.workspace')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.workspace}
              onChange={(e) => setFilters({...filters, workspace: e.target.value})}
            >
              <option value="">{t('attendance.allWorkspaces')}</option>
              <option value="cs-a">Customer Service A</option>
              <option value="cs-b">Customer Service B</option>
              <option value="tech">Technical Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('attendance.employee')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('attendance.searchEmployee')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                value={filters.employee}
                onChange={(e) => setFilters({...filters, employee: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('attendance.dateRange')}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                value={filters.dateRange.start}
                onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, start: e.target.value}})}
              />
              <input
                type="date"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                value={filters.dateRange.end}
                onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, end: e.target.value}})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('attendance.status')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">{t('attendance.allStatus')}</option>
              <option value="success">{t('attendance.status.success')}</option>
              <option value="late">{t('attendance.status.late')}</option>
              <option value="absent">{t('attendance.status.absent')}</option>
              <option value="leave">{t('attendance.status.leave')}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button 
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Filter className="w-4 h-4" />
            {loading ? t('common.loading') : t('attendance.applyFilters')}
          </button>
          
          <button 
            onClick={handleExportData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {t('attendance.exportData')}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800">Error: {error}</div>
          <button 
            onClick={loadAttendanceRecords}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.workDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.shiftTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.clockIn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.clockOut')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.workHours')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                      <div className="text-sm text-gray-500">{record.workspace}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.workDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.shiftTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <StatusBadge status={record.clockInStatus} />
                      <div className="text-xs text-gray-500">{record.clockInTime}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <StatusBadge status={record.clockOutStatus} />
                      <div className="text-xs text-gray-500">{record.clockOutTime}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{record.totalHours}h</div>
                      {record.overtimeHours > 0 && (
                        <div className="text-xs text-orange-600">
                          +{record.overtimeHours}h {t('attendance.overtime')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              {t('attendance.previous')}
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              {t('attendance.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('attendance.showing')} <span className="font-medium">1</span> {t('attendance.to')} <span className="font-medium">3</span> {t('attendance.of')} <span className="font-medium">3</span> {t('attendance.results')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  {t('attendance.previous')}
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  {t('attendance.next')}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRecords;