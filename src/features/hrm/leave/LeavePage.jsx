import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Calendar, Clock, FileText, CheckCircle, 
  XCircle, AlertCircle, User, Eye, Users, AlertTriangle,
  Edit, Trash2 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog.jsx';
import EmptyState from '../../../components/ui/empty-state';

const LeavePage = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [userBalance, setUserBalance] = useState({});
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, requestId: null, action: '', reason: '' });
  const [leaveFormData, setLeaveFormData] = useState({
    brandId: '',
    workspaceId: '',
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
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const { user, hasPermission } = useAuthStore();
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'categories', or 'manage'
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

  useEffect(() => {
    loadLeaveData();
    loadBrands();
  }, []);

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

      if (user?.id) {
        const balanceResponse = await apiClient.getLeaveBalance(user.id, new Date().getFullYear());
        const balanceData = balanceResponse.data || balanceResponse;
        setUserBalance(balanceData || {});
      }

      const memberId = localStorage.getItem('member_id') || user?.id;
      const requestsResponse = await apiClient.getLeaveRequests({ member_id: memberId });
      const requestsData = requestsResponse.data || requestsResponse;
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

  const loadWorkspaceMembers = async (workspaceId) => {
    if (!workspaceId) {
      setWorkspaceMembers([]);
      return;
    }
    try {
      const response = await apiClient.getWorkspaceMembers(workspaceId);
      const membersData = response.data || response;
      setWorkspaceMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to load workspace members:', error);
      setWorkspaceMembers([]);
    }
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
    
    // Check leave balance
    const selectedType = leaveTypes.find(type => type.id == leaveFormData.typeId);
    const userLeaveBalance = userBalance[selectedType?.code];
    
    if (userLeaveBalance && userLeaveBalance.remaining <= 0) {
      setAlertDialog({
        open: true,
        type: 'warning',
        title: 'Insufficient Leave Balance',
        message: `No remaining ${selectedType.name} days available.`
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
      const newRequest = response.data || response;
      setLeaveRequests(prev => [...prev, newRequest]);
      
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Application Submitted',
        message: 'Leave request has been submitted successfully.'
      });
      
      setShowApplyDialog(false);
      setLeaveFormData({
        brandId: '',
        workspaceId: '',
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
      setWorkspaces([]);
      setWorkspaceMembers([]);
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

  const LeaveBalanceCard = ({ type, balance }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">{type.name}</h3>
          <span className="text-sm text-gray-600">
            Total: {balance.total || type.quota} days
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {balance.used} days</span>
            <span className="text-green-600">Remaining: {balance.remaining} days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(balance.used / (balance.total || type.quota)) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const LeaveRequestCard = ({ request }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{request.member_name || request.applicant?.name || request.member?.name || 'Unknown User'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(request.status)}>
              {getStatusIcon(request.status)}
              {request.status === 'pending' ? 'Pending' : 
               request.status === 'approved' ? 'Approved' : 'Rejected'}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{request.leave_type_name || 'Unknown Type'} - {request.days || 0} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {request.start_date ? new Date(request.start_date).toLocaleDateString() : 'N/A'} - 
              {request.end_date ? new Date(request.end_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Reason: </span>
            {request.reason || 'No reason provided'}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              setSelectedRequest(request);
              setShowDetailDialog(true);
            }}
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View Details
          </Button>
          
          {hasPermission('leave.approve') && request.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                onClick={() => handleApprovalAction(request.id, 'approve')}
                className="flex-1"
              >
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleApprovalAction(request.id, 'reject')}
                className="flex-1"
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <div className="flex gap-2">
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
                  workspaceId: '',
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
                setWorkspaces([]);
                setWorkspaceMembers([]);
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
      </div>

      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Leave Requests</h2>
            <div className="space-y-4">
              {Array.isArray(leaveRequests) && leaveRequests.length > 0 ? (
                leaveRequests.map(request => (
                  <LeaveRequestCard key={request.id} request={request} />
                ))
              ) : (
                <EmptyState 
                  type="leave" 
                  title="No Leave Requests" 
                  description="No leave request data available." 
                />
              )}
            </div>
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
                          setLeaveFormData(prev => ({ ...prev, brandId, workspaceId: '', userId: '' }));
                          setWorkspaceMembers([]);
                          loadBrandWorkspaces(brandId);
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
                      <label className="block text-sm font-medium mb-2">Workspace *</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={leaveFormData.workspaceId}
                        onChange={(e) => {
                          const workspaceId = e.target.value;
                          setLeaveFormData(prev => ({ ...prev, workspaceId, userId: '' }));
                          loadWorkspaceMembers(workspaceId);
                        }}
                        required
                        disabled={!leaveFormData.brandId}
                      >
                        <option value="">Select Workspace</option>
                        {workspaces.map(workspace => (
                          <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Member *</label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={leaveFormData.userId}
                        onChange={(e) => setLeaveFormData(prev => ({ ...prev, userId: e.target.value }))}
                        required
                        disabled={!leaveFormData.workspaceId}
                      >
                        <option value="">Select Member</option>
                        {workspaceMembers.map(member => (
                          <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                        ))}
                      </select>
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
                      const balance = userBalance[type.code];
                      return (
                        <option key={type.id} value={type.id}>
                          {type.name} (Remaining: {balance?.remaining || 0} days)
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
                    <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                    <option value="UTC">UTC (UTC+0)</option>
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