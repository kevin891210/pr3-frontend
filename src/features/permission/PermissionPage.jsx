import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Edit, Check, X, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';
import apiClient from '../../services/api';

const PermissionPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [tempPermissions, setTempPermissions] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    level: 1,
    is_system: false
  });
  const [deleteRoleDialog, setDeleteRoleDialog] = useState({ open: false, roleId: null, roleName: '' });

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await apiClient.getRoles();
      const rolesData = response.data || response || [];
      setRoles(rolesData);
      
      // Load permissions for each role
      const rolePermissionsMap = {};
      for (const role of rolesData) {
        try {
          const permResponse = await apiClient.getRolePermissions(role.id);
          rolePermissionsMap[role.id] = permResponse.data || permResponse || [];
        } catch (error) {
          console.error(`Failed to load permissions for role ${role.name}:`, error);
          rolePermissionsMap[role.id] = [];
        }
      }
      setRolePermissions(rolePermissionsMap);
    } catch (error) {
      console.error('Failed to load roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await apiClient.getPermissions();
      setPermissions(response.data || response || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions([]);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setTempPermissions([...rolePermissions[role.id] || []]);
  };

  const handleSaveRole = async () => {
    try {
      await apiClient.updateRolePermissions(editingRole.id, tempPermissions);
      setRolePermissions({
        ...rolePermissions,
        [editingRole.id]: [...tempPermissions]
      });
      setEditingRole(null);
      setTempPermissions([]);
    } catch (error) {
      console.error('Failed to update role permissions:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setTempPermissions([]);
  };

  const togglePermission = (permissionId) => {
    if (tempPermissions.includes(permissionId)) {
      setTempPermissions(tempPermissions.filter(p => p !== permissionId));
    } else {
      setTempPermissions([...tempPermissions, permissionId]);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await apiClient.updateRole(editingRole.id, roleFormData);
      } else {
        await apiClient.createRole(roleFormData);
      }
      await loadRoles();
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', level: 1, is_system: false });
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const handleDeleteRole = (role) => {
    setDeleteRoleDialog({
      open: true,
      roleId: role.id,
      roleName: role.name
    });
  };

  const confirmDeleteRole = async () => {
    try {
      await apiClient.deleteRole(deleteRoleDialog.roleId);
      await loadRoles();
      setDeleteRoleDialog({ open: false, roleId: null, roleName: '' });
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('permissions.management')}</h1>
          <p className="text-gray-600">{t('permissions.description')}</p>
        </div>
      </div>

      <div className="mb-4">
        <Button onClick={() => {
          setEditingRole(null);
          setRoleFormData({ name: '', description: '', level: 1, is_system: false });
          setShowRoleModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => {
          const rolePerms = rolePermissions[role.id] || [];
          return (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <div>
                      <div>{role.name}</div>
                      {role.is_system && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          System Role
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingRole?.id === role.id ? (
                      <>
                        <Button size="sm" onClick={handleSaveRole}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!role.is_system && (
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRole(role)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {role.description && (
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                )}
                {editingRole?.id === role.id ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {permissions && Object.entries(permissions).map(([module, modulePermissions]) => (
                      <div key={module} className="mb-3">
                        <div className="text-xs font-semibold text-gray-700 uppercase mb-2">{module}</div>
                        {modulePermissions.map(perm => (
                          <div key={perm.id} className="flex items-center gap-2 ml-2">
                            <input
                              type="checkbox"
                              checked={tempPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{perm.name}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rolePerms.length > 0 ? (
                      rolePerms.slice(0, 5).map(permId => {
                        let perm = null;
                        if (permissions && typeof permissions === 'object') {
                          // Search through all modules for the permission
                          Object.values(permissions).forEach(modulePerms => {
                            const found = modulePerms.find(p => p.id === permId);
                            if (found) perm = found;
                          });
                        }
                        return perm ? (
                          <div key={permId} className="flex items-center justify-between">
                            <span className="text-sm">{perm.name}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {t('permissions.allowed')}
                            </span>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <span className="text-sm text-gray-500">No permissions assigned</span>
                    )}
                    {rolePerms.length > 5 && (
                      <div className="text-xs text-gray-500">
                        +{rolePerms.length - 5} more permissions
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role Creation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingRole ? 'Edit Role' : 'Create Custom Role'}
            </h3>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name *</label>
                <Input
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                  placeholder="Enter role description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={roleFormData.level}
                  onChange={(e) => setRoleFormData({...roleFormData, level: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRole ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Dialog */}
      <Dialog open={deleteRoleDialog.open} onOpenChange={(open) => !open && setDeleteRoleDialog({ open: false, roleId: null, roleName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteRoleDialog.roleName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoleDialog({ open: false, roleId: null, roleName: '' })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteRole}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionPage;