import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Edit, Check, X, Plus, Trash2, Users, Key, Search, CheckSquare, Square, Minus } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState({});
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
          const responseData = permResponse.data || permResponse;
          // Handle API response structure: data is array of permission objects
          rolePermissionsMap[role.id] = responseData || [];
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
      const permissionsData = response.data || response || [];
      
      // Group permissions by module
      const groupedPermissions = permissionsData.reduce((groups, perm) => {
        const module = perm.module || '其他';
        if (!groups[module]) groups[module] = [];
        groups[module].push(perm);
        return groups;
      }, {});
      
      setPermissions(groupedPermissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions({});
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    // Extract permission IDs from role permissions
    const rolePerms = rolePermissions[role.id] || [];
    const permissionIds = rolePerms.map(perm => perm.id);
    setTempPermissions([...permissionIds]);
  };

  const handleSaveRole = async () => {
    try {
      await apiClient.updateRolePermissions(editingRole.id, tempPermissions);
      setEditingRole(null);
      setTempPermissions([]);
      // Refresh data to ensure consistency
      await loadRoles();
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
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleFormData({ name: '', description: '', level: 1, is_system: false });
      // Refresh all data after role changes
      await loadRoles();
      await loadPermissions();
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
      setDeleteRoleDialog({ open: false, roleId: null, roleName: '' });
      // Refresh all data after deletion
      await loadRoles();
      await loadPermissions();
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
                  <div className="space-y-3">
                    {/* Search and Bulk Actions */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="搜尋權限..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const allPermissionIds = Object.values(permissions).flat().map(p => p.id);
                            setTempPermissions(allPermissionIds);
                          }}
                        >
                          <CheckSquare className="w-3 h-3 mr-1" />
                          全選
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTempPermissions([])}
                        >
                          <Square className="w-3 h-3 mr-1" />
                          全不選
                        </Button>
                      </div>
                    </div>

                    {/* Permission Groups */}
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {permissions && Object.entries(permissions)
                        .filter(([module, modulePermissions]) => {
                          if (!searchTerm) return true;
                          return module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 modulePermissions.some(p => 
                                   p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
                                 );
                        })
                        .map(([module, modulePermissions]) => {
                          const filteredPermissions = searchTerm 
                            ? modulePermissions.filter(p => 
                                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
                              )
                            : modulePermissions;
                          
                          if (filteredPermissions.length === 0) return null;
                          
                          const modulePermIds = filteredPermissions.map(p => p.id);
                          const selectedCount = modulePermIds.filter(id => tempPermissions.includes(id)).length;
                          const isExpanded = expandedModules[module] !== false; // default expanded
                          
                          return (
                            <div key={module} className="border rounded-lg p-3">
                              <div 
                                className="flex items-center justify-between cursor-pointer mb-2"
                                onClick={() => setExpandedModules(prev => ({ ...prev, [module]: !isExpanded }))}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                  <span className="font-medium text-sm">{module}</span>
                                  <span className="text-xs text-gray-500">({selectedCount}/{filteredPermissions.length})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedCount === filteredPermissions.length) {
                                        // Deselect all in this module
                                        setTempPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
                                      } else {
                                        // Select all in this module
                                        setTempPermissions(prev => [...new Set([...prev, ...modulePermIds])]);
                                      }
                                    }}
                                  >
                                    {selectedCount === 0 ? (
                                      <Square className="w-3 h-3" />
                                    ) : selectedCount === filteredPermissions.length ? (
                                      <CheckSquare className="w-3 h-3" />
                                    ) : (
                                      <Minus className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="grid grid-cols-1 gap-2">
                                  {filteredPermissions.map(perm => (
                                    <div key={perm.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                                      <input
                                        type="checkbox"
                                        checked={tempPermissions.includes(perm.id)}
                                        onChange={() => togglePermission(perm.id)}
                                        className="rounded mt-0.5"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                                        {perm.description && (
                                          <div className="text-xs text-gray-500 mt-0.5">{perm.description}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      }
                    </div>
                    
                    {/* Selected Count */}
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      已選擇 {tempPermissions.length} 個權限
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rolePerms.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-700">
                            權限總數: {rolePerms.length}
                          </span>
                          <Key className="h-3 w-3 text-gray-400" />
                        </div>
                        
                        {/* Group permissions by module */}
                        {Object.entries(
                          rolePerms.reduce((groups, perm) => {
                            const module = perm.module || '其他';
                            if (!groups[module]) groups[module] = [];
                            groups[module].push(perm);
                            return groups;
                          }, {})
                        ).map(([module, modulePerms]) => (
                          <div key={module} className="mb-3">
                            <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              {module}
                            </div>
                            <div className="flex flex-wrap gap-1 ml-3">
                              {modulePerms.map(perm => (
                                <span 
                                  key={perm.id} 
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                                  title={perm.description || perm.name}
                                >
                                  {perm.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-gray-400 mb-1">🚫</div>
                        <span className="text-sm text-gray-500">無權限</span>
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