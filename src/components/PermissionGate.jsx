import { usePermissionCheck } from '../hooks/usePermissionCheck';

const PermissionGate = ({ 
  children, 
  permission, 
  page, 
  role, 
  module, 
  action,
  fallback = null 
}) => {
  const { 
    hasPermission, 
    hasPageAccess, 
    hasCrudPermission, 
    getUserRole 
  } = usePermissionCheck();

  let hasAccess = true;

  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }

  if (page && !hasPageAccess(page)) {
    hasAccess = false;
  }

  if (role) {
    const userRole = getUserRole();
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(userRole)) {
      hasAccess = false;
    }
  }

  if (module && action && !hasCrudPermission(module, action)) {
    hasAccess = false;
  }

  return hasAccess ? children : fallback;
};

export default PermissionGate;