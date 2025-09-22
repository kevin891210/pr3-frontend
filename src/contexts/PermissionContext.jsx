import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const response = await apiClient.getUserPermissions();
      setPermissions(response.data || response);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      // 使用默認權限
      setPermissions({
        role: 'Admin',
        permissions: ['*'],
        pages: ['*'],
        can_approve_leave: true,
        crud_permissions: {
          brand: { create: true, read: true, edit: true, delete: true },
          user: { create: true, read: true, edit: true, delete: true },
          schedule: { create: true, read: true, edit: true, delete: true },
          leave: { create: true, read: true, edit: true, delete: true }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, loading, fetchPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};