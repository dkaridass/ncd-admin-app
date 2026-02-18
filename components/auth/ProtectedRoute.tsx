import React from 'react';
import { Navigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Permission } from '../../types';

interface ProtectedRouteProps {
    children: React.ReactElement;
    requiredPermission?: Permission;
    fallbackPath?: string;
}

/**
 * Route wrapper that enforces role-based access control.
 * 
 * Usage:
 * <Route path="/finances" element={
 *   <ProtectedRoute requiredPermission="VIEW_FINANCES">
 *     <FinancesPage />
 *   </ProtectedRoute>
 * } />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermission,
    fallbackPath = '/dashboard'
}) => {
    const { currentUser, hasPermission } = useData();

    // Not authenticated - should not happen if App.tsx gate works, but safety check
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // No permission required - allow access
    if (!requiredPermission) {
        return children;
    }

    // Check permission
    if (!hasPermission(requiredPermission)) {
        console.warn(`Access denied: User ${currentUser.email} lacks permission ${requiredPermission}`);
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};
