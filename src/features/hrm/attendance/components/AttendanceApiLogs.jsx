import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Filter, Download, Eye, CheckCircle, 
  XCircle, Clock, AlertTriangle, ExternalLink 
} from 'lucide-react';
import { apiClient } from '@/services/api.js';
import { useAuthStore } from '@/store/authStore.jsx';

const AttendanceApiLogs = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    brand: '',
    workspace: '',
    dateRange: { start: '', end: '' },
    status: '',
    responseTime: { min: '', max: '' }
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  
  useEffect(() => {
    loadBrands();
    loadApiLogs();
  }, []);

  useEffect(() => {
    if (filters.brand) {
      loadWorkspaces(filters.brand);
    } else {
      setWorkspaces([]);
      setFilters(prev => ({ ...prev, workspace: '' }));
    }
  }, [filters.brand]);

  const loadBrands = async () => {
    try {
      const response = await apiClient.getBrands();
      if (response.data && Array.isArray(response.data)) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  };

  const loadWorkspaces = async (brandId) => {
    try {
      const response = await apiClient.getBrandWorkspaces(brandId);
      if (response.data && Array.isArray(response.data)) {
        setWorkspaces(response.data);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      setWorkspaces([]);
    }
  };

  const loadApiLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      if (!workspaceId) {
        throw new Error('Workspace ID not found. Please login again.');
      }
      
      // 只包含非空的參數
      const params = {};
      if (filters.dateRange.start) params.start_date = filters.dateRange.start;
      if (filters.dateRange.end) params.end_date = filters.dateRange.end;
      if (filters.brand) params.brand_id = filters.brand;
      if (filters.workspace) params.workspace_id = filters.workspace;
      if (filters.status) params.status = filters.status;
      if (filters.responseTime.min) params.min_response_time = filters.responseTime.min;
      if (filters.responseTime.max) params.max_response_time = filters.responseTime.max;
      
      const response = await apiClient.getAttendanceApiLogs(workspaceId, params);
      
      if (response.data && response.data.logs && Array.isArray(response.data.logs)) {
        setApiLogs(response.data.logs);
      } else {
        setApiLogs([]);
      }
    } catch (error) {
      console.error('Failed to load API logs:', error);
      setError(error.message);
      setApiLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadApiLogs();
  };

  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    timeout: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' }
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig['error'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3" />
        {t(`attendance.apiStatus.${status}`)}
      </span>
    );
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleExportProof = async () => {
    try {
      const workspaceId = user?.workspace_id || localStorage.getItem('workspace_id') || '1';
      
      const response = await apiClient.exportAttendanceProof(workspaceId, {
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
        workspace: filters.workspace,
        status: filters.status
      });
      
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
      } else {
        alert('Export completed successfully');
      }
    } catch (error) {
      console.error('Failed to export proof:', error);
      alert('Export failed: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800">Error: {error}</div>
          <button 
            onClick={loadApiLogs}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Brand
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.brand}
              onChange={(e) => setFilters({...filters, brand: e.target.value, workspace: ''})}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('attendance.workspace')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.workspace}
              onChange={(e) => setFilters({...filters, workspace: e.target.value})}
              disabled={!filters.brand}
            >
              <option value="">{t('attendance.allWorkspaces')}</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('attendance.dateRange')}
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="date"
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.dateRange.start}
                onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, start: e.target.value}})}
              />
              <input
                type="date"
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.dateRange.end}
                onChange={(e) => setFilters({...filters, dateRange: {...filters.dateRange, end: e.target.value}})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('attendance.status')}
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">{t('attendance.allStatus')}</option>
              <option value="success">{t('attendance.apiStatus.success')}</option>
              <option value="error">{t('attendance.apiStatus.error')}</option>
              <option value="timeout">{t('attendance.apiStatus.timeout')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('attendance.responseTime')} (ms)
            </label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="number"
                placeholder="Min"
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.responseTime.min}
                onChange={(e) => setFilters({...filters, responseTime: {...filters.responseTime, min: e.target.value}})}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.responseTime.max}
                onChange={(e) => setFilters({...filters, responseTime: {...filters.responseTime, max: e.target.value}})}
              />
            </div>
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
            onClick={handleExportProof}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            {t('attendance.exportProof')}
          </button>
        </div>
      </div>

      {/* API Logs Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.timestamp')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.workspace')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.endpoint')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.responseTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.onlineCount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('attendance.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.workspace}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.endpoint}</div>
                    <div className="text-xs text-gray-500">{log.method}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <StatusBadge status={log.status} />
                      <div className="text-xs text-gray-500">HTTP {log.statusCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      log.responseTime > 1000 ? 'text-red-600' : 
                      log.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {log.responseTime}ms
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.onlineCount}/{log.scheduledCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Log Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('attendance.apiLogDetails')}</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('attendance.timestamp')}</label>
                    <p className="text-sm text-gray-900">{selectedLog.timestamp}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('attendance.workspace')}</label>
                    <p className="text-sm text-gray-900">{selectedLog.workspace}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('attendance.endpoint')}</label>
                    <p className="text-sm text-gray-900">{selectedLog.endpoint}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('attendance.method')}</label>
                    <p className="text-sm text-gray-900">{selectedLog.method}</p>
                  </div>
                </div>

                {/* Request Details */}
                <div>
                  <h4 className="font-medium mb-2">{t('attendance.requestDetails')}</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700">
{`Headers:
Authorization: Bearer ***
Content-Type: application/json

Parameters:
workspace_id: ${selectedLog.workspace.toLowerCase().replace(' ', '-')}`}
                    </pre>
                  </div>
                </div>

                {/* Response Details */}
                <div>
                  <h4 className="font-medium mb-2">{t('attendance.responseDetails')}</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700">
{`Status: ${selectedLog.statusCode}
Response Time: ${selectedLog.responseTime}ms

Body:
{
  "success": ${selectedLog.status === 'success'},
  "data": {
    "online_members": ${selectedLog.onlineCount},
    "total_scheduled": ${selectedLog.scheduledCount},
    "members": [...]
  }
}`}
                    </pre>
                  </div>
                </div>

                {/* Related Records */}
                <div>
                  <h4 className="font-medium mb-2">{t('attendance.relatedRecords')}</h4>
                  <div className="text-sm text-gray-600">
                    {t('attendance.relatedRecordsDesc')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('attendance.close')}
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t('attendance.downloadLog')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceApiLogs;