import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { useData } from '../context/DataContext';
import { AppRole, User } from '../types';
import { UsersIcon, ShieldIcon, CheckCircleIcon, XCircleIcon } from '../components/icons/Icons';
import { getRoleLabel, getRoleColorClasses } from '../utils/rbac';

const UsersPage: React.FC = () => {
    const { users, currentUser, updateUserRole, updateUserStatus, hasPermission } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<AppRole | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Filter and search users
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && (user.isActive !== false)) ||
                (statusFilter === 'INACTIVE' && user.isActive === false);
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const roleCount: Partial<Record<AppRole, number>> = {};
        let activeCount = 0;
        let inactiveCount = 0;

        users.forEach(user => {
            if (user.role) {
                roleCount[user.role] = (roleCount[user.role] || 0) + 1;
            }
            if (user.isActive === false) {
                inactiveCount++;
            } else {
                activeCount++;
            }
        });

        return {
            total: users.length,
            active: activeCount,
            inactive: inactiveCount,
            ...roleCount
        };
    }, [users]);

    // Handle role change
    const handleRoleChange = async (userId: string, newRole: AppRole, userName: string) => {
        // Confirmation for critical changes
        const targetUser = users.find(u => u.id === userId);
        if (targetUser?.role === 'SUPER_ADMIN') {
            if (!window.confirm(`⚠️ Attention! Vous êtes sur le point de retirer le rôle SUPER_ADMIN de ${userName}. Êtes-vous sûr?`)) {
                return;
            }
        }

        setIsUpdating(userId);
        try {
            await updateUserRole(userId, newRole);
            // Success feedback
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
            toast.innerHTML = `✅ Rôle de ${userName} mis à jour: ${getRoleLabel(newRole)}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error: any) {
            alert(`❌ Erreur: ${error.message}`);
        } finally {
            setIsUpdating(null);
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (userId: string, userName: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const action = newStatus ? 'activer' : 'désactiver';

        if (!window.confirm(`Êtes-vous sûr de vouloir ${action} le compte de ${userName}?`)) {
            return;
        }

        setIsUpdating(userId);
        try {
            await updateUserStatus(userId, newStatus);
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
            toast.innerHTML = `✅ Compte de ${userName} ${newStatus ? 'activé' : 'désactivé'}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error: any) {
            alert(`❌ Erreur: ${error.message}`);
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <PageTransition>
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-extrabold text-primary font-display tracking-tight leading-none">
                        Gestion des Utilisateurs
                    </h2>
                    <p className="text-slate-500 font-medium mt-2">
                        Gérez les rôles et les accès de l'équipe ({stats.total} utilisateurs)
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-primary' },
                    { label: 'Actifs', value: stats.active, color: 'bg-emerald-500' },
                    { label: 'Inactifs', value: stats.inactive, color: 'bg-slate-400' },
                    { label: 'Admins', value: (stats.SUPER_ADMIN || 0), color: 'bg-purple-500' },
                    { label: 'Pasteurs', value: (stats.PASTOR || 0), color: 'bg-blue-500' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-soft rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-black text-primary">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                                <UsersIcon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom ou email..."
                        className="pl-12 rounded-2xl py-4"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as AppRole | 'ALL')}
                    className="px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
                >
                    <option value="ALL">Tous les rôles</option>
                    {(['SUPER_ADMIN', 'PASTOR', 'STAFF_ADMIN', 'FINANCE_ADMIN', 'DEPT_LEADER', 'VOLUNTEER', 'MEMBER', 'VIEWER'] as AppRole[]).map(role => (
                        <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                    className="px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
                >
                    <option value="ALL">Tous les statuts</option>
                    <option value="ACTIVE">Actifs</option>
                    <option value="INACTIVE">Inactifs</option>
                </select>
            </div>

            {/* Users Table */}
            <Card className="border-none shadow-premium rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Rôle
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Statut
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Créé le
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400">
                                            {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                                                ? 'Aucun utilisateur trouvé'
                                                : 'Aucun utilisateur enregistré'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isActive = user.isActive !== false; // Default to true if not set
                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                                                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {user.name || 'Sans nom'}
                                                        </p>
                                                        {user.id === currentUser?.id && (
                                                            <span className="text-xs text-emerald-600 font-bold">(Vous)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600 font-medium">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <PermissionGuard permission="MANAGE_ROLES" fallback={
                                                    <Badge className={getRoleColorClasses(user.role)}>
                                                        {getRoleLabel(user.role)}
                                                    </Badge>
                                                }>
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as AppRole, user.name || user.email || '')}
                                                        disabled={isUpdating === user.id || user.id === currentUser?.id}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border-none outline-none cursor-pointer transition-all ${getRoleColorClasses(user.role)} ${isUpdating === user.id ? 'opacity-50 cursor-wait' : 'hover:shadow-md'} ${user.id === currentUser?.id ? 'cursor-not-allowed opacity-75' : ''}`}
                                                    >
                                                        {(['SUPER_ADMIN', 'PASTOR', 'STAFF_ADMIN', 'SECRETARY', 'FINANCE_ADMIN', 'DEPT_LEADER', 'VOLUNTEER', 'MEMBER', 'VIEWER'] as AppRole[]).map((role) => (
                                                            <option key={role} value={role}>{getRoleLabel(role)}</option>
                                                        ))}
                                                    </select>
                                                </PermissionGuard>
                                            </td>
                                            <td className="px-6 py-4">
                                                <PermissionGuard permission="MANAGE_ROLES" fallback={
                                                    <Badge className={isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                                                        {isActive ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                }>
                                                    <button
                                                        onClick={() => handleStatusToggle(user.id, user.name || user.email || '', isActive)}
                                                        disabled={isUpdating === user.id || user.id === currentUser?.id}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                            } ${isUpdating === user.id ? 'opacity-50 cursor-wait' : ''} ${user.id === currentUser?.id ? 'cursor-not-allowed opacity-75' : ''}`}
                                                    >
                                                        {isActive ? (
                                                            <>
                                                                <CheckCircleIcon className="w-4 h-4" />
                                                                Actif
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircleIcon className="w-4 h-4" />
                                                                Inactif
                                                            </>
                                                        )}
                                                    </button>
                                                </PermissionGuard>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-500">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Info Banner */}
            <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
                <ShieldIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs text-amber-800 font-bold mb-1">Gestion des Rôles</p>
                    <p className="text-xs text-amber-700/70 leading-relaxed">
                        Seuls les SUPER_ADMIN peuvent modifier les rôles. Les changements sont appliqués immédiatement et
                        affectent les permissions d'accès de l'utilisateur dans l'application.
                    </p>
                </div>
            </div>
        </PageTransition>
    );
};

export default UsersPage;
