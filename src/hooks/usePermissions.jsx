import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user, hasPermission, hasRole } = useAuthStore();

  const permissions = {
    // 系統管理
    canManageSystem: () => hasPermission('system.write'),
    canViewSystem: () => hasPermission('system.read'),
    
    // 使用者管理
    canManageUsers: () => hasPermission('user.write'),
    canViewUsers: () => hasPermission('user.read'),
    
    // Brand 管理
    canManageBrands: () => hasPermission('brand.write'),
    canViewBrands: () => hasPermission('brand.read'),
    
    // 排班管理
    canManageSchedules: () => hasPermission('schedule.write'),
    canViewSchedules: () => hasPermission('schedule.read'),
    canAssignSchedules: () => hasPermission('schedule.write') || hasRole('TeamLeader'),
    
    // 請假管理
    canApproveLeave: () => hasPermission('leave.approve'),
    canApplyLeave: () => hasPermission('leave.create'),
    canViewLeave: () => hasPermission('leave.read'),
    
    // 公告管理
    canManageNotices: () => hasPermission('notice.write'),
    canViewNotices: () => hasPermission('notice.read'),
    
    // Agent 相關
    canViewAgentData: () => hasPermission('agent.read'),
    canManageAgents: () => hasPermission('agent.write'),
    
    // Role檢查
    isOwner: () => hasRole('Owner'),
    isAdmin: () => hasRole('Admin'),
    isTeamLeader: () => hasRole('TeamLeader'),
    isAgent: () => hasRole('Agent'),
    isAuditor: () => hasRole('Auditor')
  };

  return {
    user,
    ...permissions,
    hasPermission,
    hasRole
  };
};