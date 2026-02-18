import React from 'react';
import { useData } from '../context/DataContext';
import PageTransition from '../components/layout/PageTransition';
import Card from '../components/ui/Card';

/**
 * System Health Check Page
 * Navigate to /health-check to see current system state
 * Useful for debugging and verifying fixes
 */
const HealthCheckPage: React.FC = () => {
    const {
        currentUser,
        members,
        departments,
        financeRecords,
        events,
        attendance,
        isLoading,
        isAuthLoading
    } = useData();

    const healthData = {
        authentication: {
            isLoading: isAuthLoading,
            isAuthenticated: !!currentUser,
            user: currentUser ? {
                email: currentUser.email,
                role: currentUser.role,
                name: currentUser.name,
                id: currentUser.id
            } : null
        },
        dataLoaded: {
            isLoading: isLoading,
            members: members.length,
            departments: departments.length,
            finances: financeRecords.length,
            events: events.length,
            attendance: attendance.length
        },
        firebaseConfig: {
            projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
            authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
            hasGroqKey: !!(import.meta as any).env.VITE_GROQ_API_KEY || !!localStorage.getItem('ncd_groq_key')
        },
        timestamp: new Date().toISOString()
    };

    const getStatusColor = () => {
        if (isAuthLoading || isLoading) return 'bg-yellow-500';
        if (!currentUser) return 'bg-red-500';
        if (currentUser.role === 'SUPER_ADMIN') return 'bg-green-500';
        return 'bg-blue-500';
    };

    const getStatusText = () => {
        if (isAuthLoading) return 'Loading Auth...';
        if (isLoading) return 'Loading Data...';
        if (!currentUser) return 'Not Authenticated';
        if (currentUser.role === 'SUPER_ADMIN') return '✅ SUPER_ADMIN Active';
        return `✅ Authenticated as ${currentUser.role}`;
    };

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-primary font-display mb-2">
                        🏥 System Health Check
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Real-time system status and diagnostics
                    </p>
                </div>

                {/* Status Banner */}
                <Card className={`mb-6 ${getStatusColor()} text-white border-none`}>
                    <div className="p-6">
                        <h2 className="text-2xl font-black mb-2">{getStatusText()}</h2>
                        <p className="text-sm opacity-90">
                            Last checked: {new Date().toLocaleString()}
                        </p>
                    </div>
                </Card>

                {/* Health Data */}
                <Card className="mb-6">
                    <div className="p-6">
                        <h3 className="text-xl font-black text-primary mb-4">System State</h3>
                        <pre className="bg-slate-50 p-4 rounded-xl overflow-auto text-xs font-mono">
                            {JSON.stringify(healthData, null, 2)}
                        </pre>
                    </div>
                </Card>

                {/* Quick Checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-black text-primary mb-4">✅ Quick Checks</h3>
                            <div className="space-y-3">
                                <CheckItem
                                    label="Firebase Connected"
                                    status={!!(import.meta as any).env.VITE_FIREBASE_PROJECT_ID}
                                />
                                <CheckItem
                                    label="User Authenticated"
                                    status={!!currentUser}
                                />
                                <CheckItem
                                    label="SUPER_ADMIN Active"
                                    status={currentUser?.role === 'SUPER_ADMIN'}
                                />
                                <CheckItem
                                    label="Members Loaded"
                                    status={members.length > 0}
                                />
                                <CheckItem
                                    label="Departments Loaded"
                                    status={departments.length > 0}
                                />
                                <CheckItem
                                    label="Groq AI Configured"
                                    status={!!(import.meta as any).env.VITE_GROQ_API_KEY || !!localStorage.getItem('ncd_groq_key')}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-black text-primary mb-4">📊 Data Summary</h3>
                            <div className="space-y-3">
                                <DataStat label="Total Members" value={members.length} />
                                <DataStat label="Departments" value={departments.length} />
                                <DataStat label="Finance Records" value={financeRecords.length} />
                                <DataStat label="Events" value={events.length} />
                                <DataStat label="Attendance Records" value={attendance.length} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Troubleshooting */}
                <Card className="mt-6 bg-blue-50 border-blue-200">
                    <div className="p-6">
                        <h3 className="text-lg font-black text-blue-900 mb-3">🔧 Troubleshooting</h3>
                        <div className="text-sm text-blue-800 space-y-2">
                            <p><strong>Not SUPER_ADMIN?</strong> Log out and log in again as admin@ncd.com</p>
                            <p><strong>No data showing?</strong> Check Firestore security rules are deployed</p>
                            <p><strong>Permission errors?</strong> Open browser console (F12) for details</p>
                            <p><strong>Need help?</strong> Check docs/PERMISSIONS.md for full documentation</p>
                        </div>
                    </div>
                </Card>
            </div>
        </PageTransition>
    );
};

const CheckItem: React.FC<{ label: string; status: boolean }> = ({ label, status }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className={`text-xs font-black px-3 py-1 rounded-full ${status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            {status ? '✓ PASS' : '✗ FAIL'}
        </span>
    </div>
);

const DataStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-lg font-black text-primary">{value}</span>
    </div>
);

export default HealthCheckPage;
