import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Calendar, Clock, FileText, CheckCircle,
  XCircle, AlertCircle, User, Eye, Users, AlertTriangle,
  Edit, Trash2, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog.jsx';
import EmptyState from '../../../components/ui/empty-state';
import SearchableSelect from '../../../components/ui/searchable-select';
import useWebSocket from '../../../hooks/useWebSocket';
import { useToast } from '../../../components/ui/toast';
import ResponsiveTable from '../../../components/ui/responsive-table';
import AgentLeaveConfig from './components/AgentLeaveConfig';

const LeavePage = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [userBalance, setUserBalance] = useState({});
  const [memberBalances, setMemberBalances] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [requestsTab, setRequestsTab] = useState('pending'); // 'pending' or 'history'
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, requestId: null, action: '', reason: '' });
  const [leaveFormData, setLeaveFormData] = useState({
    brandId: '',
    userId: '',
    typeId: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    timezone: 'Asia/Taipei',
    reason: '',
    isHalfDay: false
  });
  const [brands, setBrands] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [brandMembers, setBrandMembers] = useState([]);
  const { user, hasPermission } = useAuthStore();
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'categories', 'manage', or 'agent-config'
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [leaveTypeFormData, setLeaveTypeFormData] = useState({
    name: '',
    code: '',
    days_per_year: 14,
    allow_half_day: true,
    require_attachment: false,
    description: ''
  });
  const [deleteLeaveTypeDialog, setDeleteLeaveTypeDialog] = useState({ open: false, typeId: null, typeName: '' });

  const { subscribe } = useWebSocket('leave_requests');
  const { toast } = useToast();

  useEffect(() => {
    loadLeaveData();
    loadBrands();
    
    // 訂閱 WebSocket 更新
    const unsubscribe = subscribe('leave_request_update', (data) => {
      console.log('Received leave request update:', data);
      
      // 刷新請假申請列表
      loadLeaveData();
      
      // 顯示通知
      const message = `Leave request ${data.action} for ${data.data?.member_name || 'user'}`;
      toast({
        title: 'Leave Request Update',
        description: message,
        variant: data.action === 'approved' ? 'success' : data.action === 'rejected' ? 'destructive' : 'default'
      });
    });
    
    return unsubscribe;
  }, [subscribe]);

  useEffect(() => {
    if (user) {
      loadLeaveData();
    }
  }, [user]);

  const loadLeaveData = async () => {
    try {
      const typesResponse = await apiClient.getLeaveTypes();
      const typesData = typesResponse.data || typesResponse;
      setLeaveTypes(Array.isArray(typesData) ? typesData : []);

      // HRM 管理者查看所有員工餘額，Agent 只查看自己的餘額
      const isAgent = user?.role === 'agent' || localStorage.getItem('user_type') === 'agent';
      
      if (isAgent) {
        // Agent 查詢自己的請假餘額
        const memberId = localStorage.getItem('member_id') || user?.member_id || user?.id;
        if (memberId) {
          try {
            const balanceResponse = await apiClient.getLeaveBalance(memberId, new Date().getFullYear());
            const balanceData = balanceResponse.data || balanceResponse;
            
            // Convert array format to object format keyed by leave_type_name
            const balanceObj = {};
            if (Array.isArray(balanceData)) {
              balanceData.forEach(balance => {
                const key = balance.leave_type_name?.replace(/\s+/g, '_').toUpperCase() || 'UNKNOWN';
                balanceObj[key] = {
                  total: balance.total_days,
                  used: balance.used_days,
                  remaining: balance.remaining_days
                };
              });
            }
            setUserBalance(balanceObj);
          } catch (error) {
            console.warn('Leave balance API not available, using fallback data:', error.message);
            const fallbackBalance = {};
            leaveTypes.forEach(type => {
              const totalDays = type.quota || type.days_per_year || 14;
              fallbackBalance[type.code] = {
                total: totalDays,
                used: 0,
                remaining: totalDays
              };
            });
            setUserBalance(fallbackBalance);
          }
        }
      } else {
        // HRM 管理者使用預設餘額資料
        const fallbackBalance = {};
        leaveTypes.forEach(type => {
          const totalDays = type.quota || type.days_per_year || 14;
          fallbackBalance[type.code] = {
            total: totalDays,
            used: 0,
            remaining: totalDays
          };
        });
        setUserBalance(fallbackBalance);
      }

      // HRM 管理者可以看到所有請假申請，Agent 只能看到自己的
      const requestParams = isAgent ? 
        { member_id: localStorage.getItem('member_id') || user?.id } : 
        { page: pagination.currentPage, limit: pagination.pageSize };
        
      const requestsResponse = await apiClient.getLeaveRequests(requestParams);
      const requestsData = requestsResponse.data || requestsResponse;
      
      // 更新分頁資訊（只在 HRM 管理者模式下）
      if (!isAgent && requestsResponse.pagination) {
        setPagination(prev => ({
          ...prev,
          totalItems: requestsResponse.pagination.total || requestsData.length,
          totalPages: requestsResponse.pagination.pages || Math.ceil(requestsData.length / prev.pageSize)
        }));
      } else if (!isAgent) {
        // 如果沒有分頁資訊，使用預設值
        setPagination(prev => ({
          ...prev,
          totalItems: requestsData.length,
          totalPages: Math.ceil(requestsData.length / prev.pageSize)
        }));
      }
      
      setLeaveRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      setLeaveTypes([]);
      setUserBalance({});
      setLeaveRequests([]);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await apiClient.getBrands();
      const brandsData = response.data || response;
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    }
  };

  const loadBrandWorkspaces = async (brandId) => {
    if (!brandId) {
      setWorkspaces([]);
      return;
    }
    try {
      const response = await apiClient.getBrandWorkspaces(brandId);
      const workspacesData = response.data || response;
      setWorkspaces(Array.isArray(workspacesData) ? workspacesData : []);
    } catch (error) {
      console.error('Failed to load brand workspaces:', error);
      setWorkspaces([]);
    }
  };

  const loadBrandMembers = async (brandId) => {
    if (!brandId) {
      setBrandMembers([]);
      setMemberBalances({});
      return;
    }
    try {
      const response = await apiClient.getBrandMembers(brandId);
      const membersData = response.data || response;
      setBrandMembers(Array.isArray(membersData) ? membersData : []);
      
      // 載入每個成員的請假餘額
      await loadMemberBalances(membersData);
    } catch (error) {
      console.error('Failed to load brand members:', error);
      setBrandMembers([]);
      setMemberBalances({});
    }
  };

  const loadMemberBalances = async (members) => {
    if (!Array.isArray(members) || members.length === 0) return;
    
    const balances = {};
    const currentYear = new Date().getFullYear();
    
    for (const member of members) {
      try {
        const response = await apiClient.getLeaveBalance(member.id, currentYear);
        const balanceData = response.data || response;
        
        if (Array.isArray(balanceData)) {
          const memberBalance = {};
          balanceData.forEach(balance => {
            const key = balance.leave_type_id || balance.leave_type_name?.replace(/\s+/g, '_').toUpperCase();
            if (key) {
              memberBalance[key] = {
                total: balance.total_days || 0,
                used: balance.used_days || 0,
                remaining: balance.remaining_days || (balance.total_days - balance.used_days) || 0
              };
            }
          });
          balances[member.id] = memberBalance;
        }
      } catch (error) {
        console.warn(`Failed to load balance for member ${member.id}:`, error);
        // 使用預設餘額
        const defaultBalance = {};
        leaveTypes.forEach(type => {
          defaultBalance[type.id] = {
            total: type.days_per_year || 14,
            used: 0,
            remaining: type.days_per_year || 14
          };
        });
        balances[member.id] = defaultBalance;
      }
    }
    
    setMemberBalances(balances);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleApprovalAction = (requestId, action) => {
    setApprovalDialog({
      open: true,
      requestId,
      action,
      reason: ''
    });
  };

  const submitApproval = async () => {
    const { requestId, action, reason } = approvalDialog;
    if (!reason.trim()) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Reason Required',
        message: 'Please provide a reason for your decision.'
      });
      return;
    }

    try {
      if (action === 'approve') {
        await apiClient.approveLeaveRequest(requestId, reason);
      } else {
        await apiClient.rejectLeaveRequest(requestId, reason);
      }
      
      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'approve' ? 'approved' : 'rejected', [action === 'approve' ? 'approve_reason' : 'reject_reason']: reason }
            : req
        )
      );
      
      setAlertDialog({
        open: true,
        type: 'success',
        title: `${action === 'approve' ? 'Approved' : 'Rejected'} Successfully`,
        message: `Leave request has been ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
      
      setApprovalDialog({ open: false, requestId: null, action: '', reason: '' });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Action Failed',
        message: error.message
      });
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    
    // Check leave balance for selected member
    const selectedType = leaveTypes.find(type => type.id == leaveFormData.typeId);
    const selectedMemberId = leaveFormData.userId;
    const memberBalance = selectedMemberId ? memberBalances[selectedMemberId] : null;
    const balance = memberBalance ? memberBalance[selectedType?.id] : null;
    
    if (balance && balance.remaining <= 0) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Insufficient Leave Balance',
        message: `No remaining ${selectedType.name} days available for selected member.`
      });
      return;
    }

    try {
      // 轉換為後端需要的格式
      const startDate = new Date(leaveFormData.startDate);
      const endDate = new Date(leaveFormData.endDate);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      const requestData = {
        member_id: leaveFormData.userId,
        leave_type_id: leaveFormData.typeId,
        start_date: leaveFormData.startDate,
        end_date: leaveFormData.endDate,
        days: days,
        reason: leaveFormData.reason
      };
      
      const response = await apiClient.createLeaveRequest(requestData);
      
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Application Submitted',
        message: 'Leave request has been submitted successfully.'
      });
      
      setShowApplyDialog(false);
      setLeaveFormData({
        brandId: '',
        userId: '',
        typeId: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '18:00',
        timezone: 'Asia/Taipei',
        reason: '',
        isHalfDay: false
      });
      setBrandMembers([]);
      setMemberBalances({});
      
      // 重新載入資料以確保顯示正確的資訊
      await loadLeaveData();
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Submission Failed',
        message: error.message
      });
    }
  };

  // Leave Type CRUD methods
  const handleEditLeaveType = (type) => {
    setEditingLeaveType(type);
    setLeaveTypeFormData({
      name: type.name,
      code: type.code,
      days_per_year: type.days_per_year || type.quota,
      allow_half_day: type.allow_half_day,
      require_attachment: type.require_attachment || false,
      description: type.description || ''
    });
    setShowLeaveTypeModal(true);
  };

  const handleDeleteLeaveType = (type) => {
    setDeleteLeaveTypeDialog({
      open: true,
      typeId: type.id,
      typeName: type.name
    });
  };

  const handleLeaveTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLeaveType) {
        const response = await apiClient.updateLeaveType(editingLeaveType.id, leaveTypeFormData);
        const updatedType = response.data || response;
        setLeaveTypes(prev => prev.map(type => 
          type.id === editingLeaveType.id ? updatedType : type
        ));
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: activeTab === 'categories' ? 'Leave category updated successfully' : 'Leave type updated successfully'
        });
      } else {
        const response = await apiClient.createLeaveType(leaveTypeFormData);
        const newType = response.data || response;
        setLeaveTypes(prev => [...prev, newType]);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Create Success',
          message: activeTab === 'categories' ? 'Leave category created successfully' : 'Leave type created successfully'
        });
      }
      setShowLeaveTypeModal(false);
      setEditingLeaveType(null);
      setLeaveTypeFormData({ name: '', code: '', days_per_year: 14, allow_half_day: true, require_attachment: false, description: '' });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Save Failed',
        message: error.message
      });
    }
  };

  const confirmDeleteLeaveType = async () => {
    try {
      await apiClient.deleteLeaveType(deleteLeaveTypeDialog.typeId);
      setLeaveTypes(prev => prev.filter(type => type.id !== deleteLeaveTypeDialog.typeId));
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Delete Success',
        message: activeTab === 'categories' ? 'Leave category deleted successfully' : 'Leave type deleted successfully'
      });
    } catch (error) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Delete Failed',
        message: error.message
      });
    }
    setDeleteLeaveTypeDialog({ open: false, typeId: null, typeName: '' });
  };

  const LeaveBalanceCard = ({ type, balance }) => {
    const totalDays = balance?.total || type?.quota || type?.days_per_year || 0;
    const usedDays = balance?.used || 0;
    const remainingDays = balance?.remaining || (totalDays - usedDays);
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{type.name}</h3>
            <span className="text-sm text-gray-600">
              Total: {totalDays} days
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {usedDays} days</span>
              <span className="text-green-600">Remaining: {remainingDays} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${totalDays > 0 ? (usedDays / totalDays) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Leave Management</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          {activeTab === 'categories' && hasPermission('leave.admin') && (
            <Button 
              onClick={() => {
                setEditingLeaveType(null);
                setLeaveTypeFormData({
                  name: '',
                  code: '',
                  quota: 14,
                  allow_half_day: true,
                  require_attachment: false,
                  description: ''
                });
                setShowLeaveTypeModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          )}
          {activeTab === 'manage' && hasPermission('leave.admin') && (
            <Button 
              onClick={() => {
                setEditingLeaveType(null);
                setLeaveTypeFormData({
                  name: '',
                  code: '',
                  quota: 14,
                  allow_half_day: true,
                  require_attachment: false,
                  description: ''
                });
                setShowLeaveTypeModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Leave Type
            </Button>
          )}
          {activeTab === 'requests' && hasPermission('leave.create') && (
            <Button 
              onClick={() => {
                setLeaveFormData({
                  brandId: '',
                  userId: user?.id || '',
                  typeId: '',
                  startDate: '',
                  endDate: '',
                  startTime: '09:00',
                  endTime: '18:00',
                  timezone: 'Asia/Taipei',
                  reason: '',
                  isHalfDay: false
                });
                setBrandMembers([]);
                setShowApplyDialog(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Apply Leave
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('requests')}
        >
          Leave Requests
        </button>

        {hasPermission('leave.admin') && (
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'manage' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Leave Types
          </button>
        )}

        {hasPermission('leave.admin') && (
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'agent-config' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('agent-config')}
          >
            Agent Configuration
          </button>
        )}
      </div>

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Leave Balance */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Leave Balance</h2>
            <div className="space-y-4">
              {Array.isArray(leaveTypes) && leaveTypes.length > 0 ? (
                leaveTypes.map(type => (
                  <LeaveBalanceCard 
                    key={type.id} 
                    type={type} 
                    balance={userBalance[type.code] || { total: type.quota, used: 0, remaining: type.quota }}
                  />
                ))
              ) : (
                <EmptyState 
                  type="leave" 
                  title="No Leave Types" 
                  description="No leave type data available." 
                />
              )}
            </div>
          </div>

          {/* Leave Requests */}
          <div className="lg:col-span-2 order-first lg:order-last">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Leave Requests</h2>
              {pagination.totalItems > 0 && (
                <span className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} requests
                </span>
              )}
            </div>
            
            {/* Request Tabs */}
            <div className="flex border-b mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  requestsTab === 'pending' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setRequestsTab('pending')}
              >
                Pending Requests
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  requestsTab === 'history' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setRequestsTab('history')}
              >
                Review History
              </button>
            </div>
            
            {/* Requests Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <ResponsiveTable
                data={leaveRequests.filter(request => {
                  if (requestsTab === 'pending') {
                    return request.status === 'pending';
                  } else {
                    return request.status === 'approved' || request.status === 'rejected';
                  }
                }).map(request => {
                  const leaveType = leaveTypes.find(type => type.id === request.leave_type_id);
                  const member = brandMembers.find(member => member.id === request.member_id);
                  return {
                    ...request,
                    leaveType,
                    member,
                    displayName: request.member_name || member?.name || 'Unknown User',
                    displayType: request.leave_type_name || leaveType?.name || 'Unknown Type'
                  };
                })}
                columns={[
                  {
                    key: 'displayName',
                    header: 'Employee',
                    render: (value) => (
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{value}</span>
                      </div>
                    )
                  },
                  {
                    key: 'displayType',
                    header: 'Leave Type',
                    render: (value) => (
                      <span className="text-sm text-gray-900">{value}</span>
                    )
                  },
                  {
                    key: 'start_date',
                    header: 'Period',
                    render: (value, row) => (
                      <div>
                        <div className="text-sm text-gray-900">
                          {value ? new Date(value).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {row.end_date ? new Date(row.end_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'days',
                    header: 'Days',
                    render: (value) => (
                      <span className="text-sm font-medium text-gray-900">{value || 0}</span>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (value) => (
                      <Badge className={getStatusColor(value)}>
                        {getStatusIcon(value)}
                        <span className="ml-1">
                          {value === 'pending' ? 'Pending' : 
                           value === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </Badge>
                    )
                  }
                ]}
                actions={(request) => (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailDialog(true);
                      }}
                      className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="md:hidden">View</span>
                    </Button>
                    
                    {hasPermission('leave.approve') && request.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovalAction(request.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span className="md:hidden">Approve</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleApprovalAction(request.id, 'reject')}
                          className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                        >
                          <XCircle className="w-3 h-3" />
                          <span className="md:hidden">Reject</span>
                        </Button>
                      </>
                    )}
                  </>
                )}
                emptyState={
                  <EmptyState 
                    type="leave" 
                    title={`No ${requestsTab === 'pending' ? 'Pending' : 'Review History'} Requests`}
                    description={`No ${requestsTab === 'pending' ? 'pending' : 'reviewed'} leave requests available.`}
                  />
                }
              />
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Page size:</span>
                  <select
                    className="px-2 py-1 border rounded text-sm"
                    value={pagination.pageSize}
                    onChange={(e) => {
                      const newPageSize = parseInt(e.target.value);
                      setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
                      setTimeout(() => loadLeaveData(), 100);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => {
                      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                      setTimeout(() => loadLeaveData(), 100);
                    }}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setPagination(prev => ({ ...prev, currentPage: pageNum }));
                            setTimeout(() => loadLeaveData(), 100);
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <span className="text-sm text-gray-500">...</span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => {
                      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                      setTimeout(() => loadLeaveData(), 100);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Leave Categories</h2>
            <Button 
              onClick={() => {
                setEditingLeaveType(null);
                setLeaveTypeFormData({
                  name: '',
                  code: '',
                  quota: 14,
                  allow_half_day: true,
                  require_attachment: false,
                  description: ''
                });
                setShowLeaveTypeModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map(type => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-gray-600">Code: {type.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditLeaveType(type)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteLeaveType(type)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Quota: {type.quota} days</div>
                    <div className="flex gap-4">
                      <span className={type.allow_half_day ? 'text-green-600' : 'text-gray-400'}>
                        Half Day: {type.allow_half_day ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className={type.require_attachment ? 'text-orange-600' : 'text-gray-400'}>
                      Attachment: {type.require_attachment ? 'Required' : 'Optional'}
                    </div>
                    {type.description && (
                      <div className="text-xs">{type.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {leaveTypes.length === 0 && (
              <div className="col-span-full">
                <EmptyState 
                  type="leave" 
                  title="No Leave Categories" 
                  description="Click 'Add Category' to create your first leave category." 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map(type => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-gray-600">Code: {type.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditLeaveType(type)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteLeaveType(type)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Quota: {type.quota} days</div>
                    <div className="flex gap-4">
                      <span className={type.allow_half_day ? 'text-green-600' : 'text-gray-400'}>
                        Half Day: {type.allow_half_day ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className={type.require_attachment ? 'text-orange-600' : 'text-gray-400'}>
                      Attachment: {type.require_attachment ? 'Required' : 'Optional'}
                    </div>
                    {type.description && (
                      <div className="text-xs">{type.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {leaveTypes.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  type="leave"
                  title="No Leave Types"
                  description="Click 'Add Leave Type' to create your first leave type."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'agent-config' && (
        <AgentLeaveConfig />
      )}

      {/* Apply Leave Dialog */}
      {showApplyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
            </CardHeader>
            <form onSubmit={handleLeaveSubmit}>
              <CardContent className="space-y-4">
                {hasPermission('leave.approve') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Brand *</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={leaveFormData.brandId}
                        onChange={(e) => {
                          const brandId = e.target.value;
                          setLeaveFormData(prev => ({ ...prev, brandId, userId: '' }));
                          loadBrandMembers(brandId);
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
                        options={brandMembers.map(member => ({
                          value: member.id,
                          label: `${member.name} (${member.role || 'Member'})`
                        }))}
                        value={leaveFormData.userId}
                        onChange={(value) => setLeaveFormData(prev => ({ ...prev, userId: value }))}
                        placeholder="Select Member"
                        searchPlaceholder="Search member by name..."
                        disabled={!leaveFormData.brandId}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Leave Type *</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={leaveFormData.typeId}
                    onChange={(e) => setLeaveFormData(prev => ({ ...prev, typeId: e.target.value }))}
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(type => {
                      const selectedMemberId = leaveFormData.userId;
                      const memberBalance = selectedMemberId ? memberBalances[selectedMemberId] : null;
                      const balance = memberBalance ? memberBalance[type.id] : null;
                      const remaining = balance?.remaining ?? type.days_per_year ?? 0;
                      
                      return (
                        <option key={type.id} value={type.id}>
                          {type.name} (Remaining: {remaining} days)
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date *</label>
                    <Input 
                      type="date" 
                      value={leaveFormData.startDate}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date *</label>
                    <Input 
                      type="date" 
                      value={leaveFormData.endDate}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <Input 
                      type="time" 
                      value={leaveFormData.startTime}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <Input 
                      type="time" 
                      value={leaveFormData.endTime}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={leaveFormData.timezone}
                    onChange={(e) => setLeaveFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <optgroup label="Asia">
                      <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                      <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
                      <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                      <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
                      <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                      <option value="Asia/Jakarta">Asia/Jakarta (UTC+7)</option>
                      <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                      <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                      <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                      <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                      <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                      <option value="Europe/Berlin">Europe/Berlin (UTC+1/+2)</option>
                      <option value="Europe/Rome">Europe/Rome (UTC+1/+2)</option>
                      <option value="Europe/Madrid">Europe/Madrid (UTC+1/+2)</option>
                      <option value="Europe/Amsterdam">Europe/Amsterdam (UTC+1/+2)</option>
                      <option value="Europe/Zurich">Europe/Zurich (UTC+1/+2)</option>
                      <option value="Europe/Stockholm">Europe/Stockholm (UTC+1/+2)</option>
                      <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                    </optgroup>
                    <optgroup label="Americas">
                      <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                      <option value="America/Chicago">America/Chicago (UTC-6/-5)</option>
                      <option value="America/Denver">America/Denver (UTC-7/-6)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</option>
                      <option value="America/Toronto">America/Toronto (UTC-5/-4)</option>
                      <option value="America/Vancouver">America/Vancouver (UTC-8/-7)</option>
                      <option value="America/Mexico_City">America/Mexico_City (UTC-6/-5)</option>
                      <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3/-2)</option>
                      <option value="America/Buenos_Aires">America/Buenos_Aires (UTC-3)</option>
                    </optgroup>
                    <optgroup label="Pacific">
                      <option value="Australia/Sydney">Australia/Sydney (UTC+10/+11)</option>
                      <option value="Australia/Melbourne">Australia/Melbourne (UTC+10/+11)</option>
                      <option value="Australia/Perth">Australia/Perth (UTC+8)</option>
                      <option value="Pacific/Auckland">Pacific/Auckland (UTC+12/+13)</option>
                      <option value="Pacific/Honolulu">Pacific/Honolulu (UTC-10)</option>
                    </optgroup>
                    <optgroup label="Africa">
                      <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
                      <option value="Africa/Johannesburg">Africa/Johannesburg (UTC+2)</option>
                      <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                    </optgroup>
                    <optgroup label="UTC">
                      <option value="UTC">UTC (UTC+0)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveFormData.isHalfDay}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, isHalfDay: e.target.checked }))}
                    />
                    <span className="text-sm">Half Day Leave</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason *</label>
                  <textarea 
                    className="w-full p-2 border rounded-md h-20 resize-none"
                    placeholder="Please provide a reason for your leave request"
                    value={leaveFormData.reason}
                    onChange={(e) => setLeaveFormData(prev => ({ ...prev, reason: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowApplyDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Submit Application
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Leave Detail Dialog */}
      {showDetailDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Leave Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Applicant</label>
                  <p className="font-medium">{selectedRequest.member_name || selectedRequest.applicant?.name || 'Unknown User'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Leave Type</label>
                  <p className="font-medium">{selectedRequest.leave_type_name || 'Unknown Type'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Duration</label>
                  <p className="font-medium">{selectedRequest.days} days</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status === 'pending' ? 'Pending' : 
                     selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Period</label>
                <p className="font-medium">
                  {new Date(selectedRequest.start_date).toLocaleDateString()} - 
                  {new Date(selectedRequest.end_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Reason</label>
                <p className="font-medium">{selectedRequest.reason}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Applied Date</label>
                <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>
              
              {(selectedRequest.approve_reason || selectedRequest.reject_reason) && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    {selectedRequest.status === 'approved' ? 'Approval' : 'Rejection'} Reason
                  </label>
                  <p className="font-medium">
                    {selectedRequest.approve_reason || selectedRequest.reject_reason}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approval Dialog */}
      {approvalDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {approvalDialog.action === 'approve' ? 'Approval' : 'Rejection'} Reason *
                </label>
                <textarea 
                  className="w-full p-2 border rounded-md h-20 resize-none"
                  placeholder={`Please provide a reason for ${approvalDialog.action === 'approve' ? 'approving' : 'rejecting'} this request`}
                  value={approvalDialog.reason}
                  onChange={(e) => setApprovalDialog(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setApprovalDialog({ open: false, requestId: null, action: '', reason: '' })}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitApproval}
                  className={`flex-1 ${approvalDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Type Modal */}
      {showLeaveTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingLeaveType ? 
                  (activeTab === 'categories' ? 'Edit Leave Category' : 'Edit Leave Type') : 
                  (activeTab === 'categories' ? 'Add Leave Category' : 'Add Leave Type')
                }
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleLeaveTypeSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <Input
                    value={leaveTypeFormData.name}
                    onChange={(e) => setLeaveTypeFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter leave type name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Code *</label>
                  <Input
                    value={leaveTypeFormData.code}
                    onChange={(e) => setLeaveTypeFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Enter leave type code (e.g., ANNUAL)"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Annual Quota (days)</label>
                  <Input
                    type="number"
                    min="0"
                    value={leaveTypeFormData.days_per_year || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setLeaveTypeFormData(prev => ({ ...prev, days_per_year: value }));
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-20 resize-none"
                    value={leaveTypeFormData.description}
                    onChange={(e) => setLeaveTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveTypeFormData.allow_half_day}
                      onChange={(e) => setLeaveTypeFormData(prev => ({ ...prev, allow_half_day: e.target.checked }))}
                    />
                    <span className="text-sm">Allow Half Day</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveTypeFormData.require_attachment}
                      onChange={(e) => setLeaveTypeFormData(prev => ({ ...prev, require_attachment: e.target.checked }))}
                    />
                    <span className="text-sm">Require Attachment</span>
                  </label>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowLeaveTypeModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingLeaveType ? 'Update' : 'Create'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Leave Type Confirmation */}
      <Dialog open={deleteLeaveTypeDialog.open} onOpenChange={(open) => !open && setDeleteLeaveTypeDialog({ open: false, typeId: null, typeName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeTab === 'categories' ? 'Delete Leave Category' : 'Delete Leave Type'}</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteLeaveTypeDialog.typeName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLeaveTypeDialog({ open: false, typeId: null, typeName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteLeaveType}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alertDialog.open} onOpenChange={(open) => !open && setAlertDialog({ open: false, type: 'info', title: '', message: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertDialog.title}</DialogTitle>
          </DialogHeader>
          <p>{alertDialog.message}</p>
          <DialogFooter>
            <Button onClick={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeavePage;