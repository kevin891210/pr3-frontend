import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Users, UserCheck } from 'lucide-react';
import apiClient from '../../services/api';
import { ConfirmDialog, AlertDialog } from '../../components/ui/dialog';
import EmptyState from '../../components/ui/empty-state';

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
    role: 'Agent',
    status: 'active'
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });
  const [alertDialog, setAlertDialog] = useState({ open: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    loadUsers();
  }, []);

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
    try {
      if (editingUser) {
        const response = await apiClient.updateUser(editingUser.id, formData);
        const updatedUser = response.data || response;
        setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Update Success',
          message: '使用者資料已Update'
        });
      } else {
        const response = await apiClient.createUser(formData);
        const newUser = response.data || response;
        setUsers([...users, newUser]);
        setAlertDialog({
          open: true,
          type: 'success',
          title: 'Add Success',
          message: '使用者已成功Add'
        });
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'Agent', status: 'active' });
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
      role: user.role,
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
      setUsers(users.filter(user => user.id !== userId));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('users')}</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Agent">Agent</option>
                  <option value="TeamLeader">TeamLeader</option>
                  <option value="Admin">Admin</option>
                  <option value="Owner">Owner</option>
                  <option value="Auditor">Auditor</option>
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
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', role: 'Agent', status: 'active' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUser ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete確認對話框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, userId: null, userName: '' })}
        onConfirm={confirmDeleteUser}
        type="danger"
        title="Delete User"
        message={`Are you sure you want to delete "${deleteDialog.userName}" 嗎？This action cannot be undone。`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* 提示對話框 */}
      <AlertDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, type: 'info', title: '', message: '' })}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </div>
  );
};

export default UserPage;