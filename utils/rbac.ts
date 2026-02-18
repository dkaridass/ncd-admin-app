/**
 * RBAC Helper Utilities
 * 
 * Centralized functions for role and permission checks.
 * Use these throughout the app for consistent role-based access control.
 */

import { AppRole, Permission } from '../types';
import { ROLE_PERMISSIONS } from '../context/DataContext';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: AppRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: AppRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: AppRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: AppRole, roles: AppRole[]): boolean {
  return roles.includes(userRole);
}

/**
 * Check if a user is an admin (SUPER_ADMIN)
 */
export function isAdmin(userRole: AppRole): boolean {
  return userRole === 'SUPER_ADMIN';
}

/**
 * Check if a user is a pastor (SUPER_ADMIN or PASTOR)
 */
export function isPastor(userRole: AppRole): boolean {
  return userRole === 'SUPER_ADMIN' || userRole === 'PASTOR';
}

/**
 * Check if a user is staff (SUPER_ADMIN, PASTOR, STAFF_ADMIN, or FINANCE_ADMIN)
 */
export function isStaff(userRole: AppRole): boolean {
  return ['SUPER_ADMIN', 'PASTOR', 'STAFF_ADMIN', 'FINANCE_ADMIN'].includes(userRole);
}

/**
 * Check if a user can manage members
 */
export function canManageMembers(userRole: AppRole): boolean {
  return hasAnyPermission(userRole, ['EDIT_MEMBERS', 'DELETE_MEMBERS']);
}

/**
 * Check if a user can manage finances
 */
export function canManageFinances(userRole: AppRole): boolean {
  return hasAnyPermission(userRole, ['CREATE_FINANCES', 'EDIT_FINANCES', 'DELETE_FINANCES']);
}

/**
 * Check if a user can manage departments
 */
export function canManageDepartments(userRole: AppRole): boolean {
  return hasPermission(userRole, 'MANAGE_DEPARTMENTS');
}

/**
 * Check if a user can view private prayer requests
 */
export function canViewPrivatePrayers(userRole: AppRole): boolean {
  return hasPermission(userRole, 'VIEW_PRIVATE_PRAYERS');
}

/**
 * Get role display label
 */
export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    SUPER_ADMIN: 'Pasteur Principal',
    PASTOR: 'Pasteur Associé',
    STAFF_ADMIN: 'Admin Système',
    SECRETARY: 'Secrétariat',
    FINANCE_ADMIN: 'Trésorerie',
    DEPT_LEADER: 'Responsable Dept.',
    VOLUNTEER: 'Bénévole',
    MEMBER: 'Fidèle',
    VIEWER: 'Observateur'
  };
  return labels[role] || role;
}

/**
 * Get role color classes for UI
 */
export function getRoleColorClasses(role: AppRole): string {
  const colors: Record<AppRole, string> = {
    SUPER_ADMIN: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
    PASTOR: 'bg-blue-100 text-blue-700',
    STAFF_ADMIN: 'bg-indigo-100 text-indigo-700',
    SECRETARY: 'bg-pink-100 text-pink-700',
    FINANCE_ADMIN: 'bg-emerald-100 text-emerald-700',
    DEPT_LEADER: 'bg-orange-100 text-orange-700',
    VOLUNTEER: 'bg-gray-100 text-gray-700',
    MEMBER: 'bg-slate-100 text-slate-700',
    VIEWER: 'bg-slate-50 text-slate-500'
  };
  return colors[role] || 'bg-slate-100 text-slate-700';
}

/**
 * Check if a role can be assigned by the current user
 * Only SUPER_ADMIN can assign roles
 */
export function canAssignRole(currentUserRole: AppRole): boolean {
  return currentUserRole === 'SUPER_ADMIN';
}

/**
 * Check if a user can change another user's role
 */
export function canChangeUserRole(currentUserRole: AppRole, targetUserId: string, currentUserId: string): boolean {
  // Only SUPER_ADMIN can change roles
  if (currentUserRole !== 'SUPER_ADMIN') {
    return false;
  }

  // Cannot change your own role from SUPER_ADMIN
  if (targetUserId === currentUserId) {
    return false;
  }

  return true;
}
