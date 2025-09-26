import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ResponsiveTable from '../../components/ui/responsive-table';
import ResponsiveDialog from '../../components/ui/responsive-dialog';
import { Plus, Edit, Trash2, Eye, User, Mail, Phone, MapPin } from 'lucide-react';

const MobileTestPage = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 測試資料
  const testUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
      role: 'Admin',
      status: 'Active',
      location: 'New York',
      joinDate: '2023-01-15'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 234 567 8901',
      role: 'Manager',
      status: 'Active',
      location: 'Los Angeles',
      joinDate: '2023-02-20'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1 234 567 8902',
      role: 'Developer',
      status: 'Inactive',
      location: 'Chicago',
      joinDate: '2023-03-10'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@example.com',
      phone: '+1 234 567 8903',
      role: 'Designer',
      status: 'Active',
      location: 'Seattle',
      joinDate: '2023-04-05'
    }
  ];

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowDialog(true);
  };

  const getRoleColor = (role) => {
    const colors = {
      Admin: 'bg-red-100 text-red-700',
      Manager: 'bg-blue-100 text-blue-700',
      Developer: 'bg-green-100 text-green-700',
      Designer: 'bg-purple-100 text-purple-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mobile Test Page</h1>
          <p className="text-sm sm:text-base text-gray-600">Testing responsive components and mobile layout</p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* 搜尋欄 */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Input
              placeholder="Search users..."
              className="pl-10"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      {/* 響應式表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User List ({testUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={testUsers}
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (value) => <span className="font-medium">{value}</span>
              },
              {
                key: 'email',
                header: 'Email',
                render: (value) => (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{value}</span>
                  </div>
                )
              },
              {
                key: 'role',
                header: 'Role',
                render: (value) => (
                  <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(value)}`}>
                    {value}
                  </span>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (value) => (
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(value)}`}>
                    {value}
                  </span>
                )
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (value) => (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{value}</span>
                  </div>
                )
              },
              {
                key: 'location',
                header: 'Location',
                render: (value) => (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{value}</span>
                  </div>
                )
              }
            ]}
            actions={(user) => (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewUser(user)}
                  className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                >
                  <Eye className="w-3 h-3" />
                  <span className="md:hidden">View</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log('Edit user:', user)}
                  className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                >
                  <Edit className="w-3 h-3" />
                  <span className="md:hidden">Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => console.log('Delete user:', user)}
                  className="flex items-center gap-1 w-full md:w-auto justify-start md:justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="md:hidden">Delete</span>
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>

      {/* 響應式對話框 */}
      <ResponsiveDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={selectedUser ? `User Details - ${selectedUser.name}` : 'Add New User'}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('Save user');
                setShowDialog(false);
              }}
              className="w-full sm:w-auto"
            >
              {selectedUser ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        {selectedUser ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <p className="text-gray-900">{selectedUser.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <p className="text-gray-900">{selectedUser.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedUser.status)}`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Join Date</label>
              <p className="text-gray-900">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input placeholder="Enter user name" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input type="email" placeholder="Enter email address" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input type="tel" placeholder="Enter phone number" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select className="w-full p-2 border rounded-md">
                <option value="">Select role</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input placeholder="Enter location" />
            </div>
          </form>
        )}
      </ResponsiveDialog>
    </div>
  );
};

export default MobileTestPage;