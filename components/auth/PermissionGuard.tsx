
import React, { ReactNode } from 'react';
import { useData } from '../../context/DataContext';
import { Permission } from '../../types';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps elements that should only be visible to users with specific permissions.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useData();
  
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

export default PermissionGuard;
