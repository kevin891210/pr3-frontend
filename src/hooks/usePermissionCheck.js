import { usePermissions } from '../contexts/PermissionContext';

export const usePermissionCheck = () => {
  const { permissions } = usePermissions();

  const hasPermission = (permission) => {
    if (!permissions) return false;
    return permissions.permissions.includes('*') || permissions.permissions.includes(permission);
  };

  const hasPageAccess = (page) => {
    if (!permissions) return false;
    return permissions.pages.includes('*') || permissions.pages.includes(page);
  };

  const canApproveLeave = () => {
    if (!permissions) return false;
    return permissions.can_approve_leave;
  };

  const hasCrudPermission = (module, action) => {
    if (!permissions || !permissions.crud_permissions) return false;
    return permissions.crud_permissions[module]?.[action] || false;
  };

  const getUserRole = () => {
    return permissions?.role || null;
  };

  return {
    hasPermission,
    hasPageAccess,
    canApproveLeave,
    hasCrudPermission,
    getUserRole,
    permissions
  };
};