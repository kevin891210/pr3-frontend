import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Users, UserCheck } from 'lucide-react';
import apiClient from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';
import EmptyState from '../../components/ui/empty-state';
import ResponsiveTable from '../../components/ui/responsive-table';
import ResponsiveDialog from '../../components/ui/responsive-dialog';

const UserPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Agent',
    role_id: '',
    status: 'active'
  });
  const [roles, setRoles] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await apiClient.getRoles();
      const rolesData = response.data || response || [];
      setRoles(rolesData);
    } catch (error) {
      console.error('載入角色列表失敗:', error);
      setRoles([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiClient.getUsers();
      const userData = response.data || response;
      const mappedUsers = Array.isArray(userData) ? userData.map(user => ({
        ...user,
        status: user.is_active ? 'active' : 'inactive'
      })) : [];
      setUsers(mappedUsers);
    } catch (error) {
      console.error('載入User List失敗:', error);
      setUsers([]);
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Load Failed',
        message: `Cannot loadUser List: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 檢查新增使用者時是否有密碼
    if (!editingUser && !formData.password) {
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Validation Error',
        message: 'Password is required for new users'
      });
      return;
    }
    
    try {
      if (editingUser) {
        // 更新用戶基本資料
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          role_id: formData.role_id,
          status: formData.status
        };
        await apiClient.updateUser(editingUser.id, updateData);
        
        // 如果有輸入新密碼，則更新密碼
        if (formData.password) {
          await apiClient.updateUserPassword(editingUser.id, {
            password: formData.password
          });
        }
        
        await loadUsers();
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: formData.password ? '使用者資料和密碼已更新' : '使用者資料已更新'
        });
      } else {
        await apiClient.createUser(formData);
        await loadUsers();
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Add Success',
          message: '使用者已成功新增'
        });
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'Agent', role_id: '', status: 'active' });
    } catch (error) {
      console.error('Save使用者失敗:', error);
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Save Failed',
        message: error.message
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // 編輯時不顯示原密碼
      role: user.role,
      role_id: user.role_id || '',
      status: user.status
    });
    setShowModal(true);
  };

  const handleDelete = (user) => {
    setDeleteDialog({
      open: true,
      userId: user.id,
      userName: user.name
    });
  };

  const confirmDeleteUser = async () => {
    const { userId } = deleteDialog;
    try {
      await apiClient.deleteUser(userId);
      await loadUsers(); // 重新載入使用者列表
      setAlertDialog({
        open: true,
        type: 'success',
        title: 'Delete Success',
        message: '使用者已成功Delete'
      });
    } catch (error) {
      console.error('Delete User失敗:', error);
      setAlertDialog({
        open: true,
        type: 'danger',
        title: 'Delete Failed',
        message: error.message
      });
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user && user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getRoleColor = (role) => {
    const colors = {
      Owner: 'bg-purple-100 text-purple-700',
      Admin: 'bg-red-100 text-red-700',
      TeamLeader: 'bg-blue-100 text-blue-700',
      Agent: 'bg-green-100 text-green-700',
      Auditor: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('users')}</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage system users and permissions</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User List ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState 
              type="users" 
              title="No Users Found" 
              description="No user data available at the moment." 
            />
          ) : (
            <ResponsiveTable
              data={filteredUsers}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (value) => <span className="font-medium">{value}</span>
                },
                {
                  key: 'email',
                  header: 'Email',
                  render: (value) => <span className="text-gray-600">{value}</span>
                },
                {
                  key: 'role',
                  header: 'Role',
                  render: (value, row) => (
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(value)}`}>
                      {row.role_display_name || value}
                    </span>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      value === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {value === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  )
                }
              ]}
              actions={(user) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                  >
                    <Edit className="w-3 h-3" />
                    <span className="md:hidden">Edit</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="md:hidden">Delete</span>
                  </Button>
                </>
              )}
              loading={loading}
              emptyState={
                <EmptyState 
                  type="users" 
                  title="No Users Found" 
                  description="No user data available at the moment." 
                />
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Modal */}
      <ResponsiveDialog
        open={showModal}
        onOpenChange={setShowModal}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'Agent', role_id: '', status: 'active' });
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="user-form"
              className="w-full sm:w-auto"
            >
              {editingUser ? 'Update' : 'Add'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="輸入Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder={editingUser ? "Enter new password" : "Enter password"}
              required={!editingUser}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.role_id || formData.role}
              onChange={(e) => {
                const selectedRole = roles.find(r => r.id === e.target.value);
                if (selectedRole) {
                  setFormData({...formData, role_id: e.target.value, role: selectedRole.name});
                } else {
                  // 固定角色
                  setFormData({...formData, role: e.target.value, role_id: ''});
                }
              }}
            >
              <optgroup label="系統角色">
                <option value="Agent">Agent</option>
                <option value="TeamLeader">TeamLeader</option>
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
                <option value="Auditor">Auditor</option>
              </optgroup>
              {roles.length > 0 && (
                <optgroup label="自訂角色">
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.display_name || role.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </ResponsiveDialog>

      {/* Delete確認對話框 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, userId: null, userName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteDialog.userName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, userId: null, userName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提示對話框 */}
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

export default UserPage;