import React from 'react';
import { Department } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface DepartmentCardProps {
    department: Department;
    onClick: (dept: Department) => void;
    isMeetingToday: boolean;
}

import { useData } from '../../context/DataContext';

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, onClick, isMeetingToday }) => {
    const { members } = useData();

    // Resolve leader names (New Schema first, then ID, then Legacy)
    // Find main leader (Titulaire)
    const titulaire = department.leaders?.find(l => l.role === 'Titulaire' || l.role === 'Pasteur' || l.role === 'Berger')
        || (department.leaderId ? members.find(m => m.id === department.leaderId) : null);

    // Find VP (Adjoint)
    const adjoint = department.leaders?.find(l => l.role === 'VP' || l.role === 'Adjoint' || l.role.includes('VP'))
        || (department.vpId ? members.find(m => m.id === department.vpId) : null);

    const displayLeaderName = titulaire?.name || department.leaderName || 'Vacant';
    const displayVpName = adjoint?.name || department.vpName;

    return (
        <Card
            onClick={() => onClick(department)}
            className="group relative overflow-hidden cursor-pointer hover:shadow-lg dark:shadow-none transition-all border border-slate-100 dark:border-dark hover:border-primary/20 bg-card dark:bg-card-dark rounded-[2rem] p-8"
        >
            {/* Status Dot */}
            <div className={`absolute top-8 right-8 w-3 h-3 rounded-full ${department.reportStatus === 'À jour' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'}`} title={`Rapport: ${department.reportStatus}`} />

            {isMeetingToday && (
                <div className="absolute top-0 right-0 bg-secondary/10 text-secondary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                    Réunion
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 dark:border-dark">
                    #{department.number}
                </div>
                <div>
                    <h3 className="text-lg font-display font-black text-primary dark:text-white uppercase italic tracking-tight leading-none group-hover:text-secondary transition-colors line-clamp-1">
                        {department.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                        {department.meetingDays && department.meetingDays.length > 0
                            ? department.meetingDays.join(', ')
                            : (department.meetingDay || 'Flexible')}
                        {department.meetingTime ? ` • ${department.meetingTime}` : ''}
                    </p>
                </div>
            </div>

            {/* Leadership Section */}
            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-white/[0.02]/50 p-4 rounded-2xl border border-slate-50">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Titulaire</span>
                    <span className="text-[10px] font-bold text-primary dark:text-white truncate max-w-[120px]">{displayLeaderName}</span>
                </div>
                {displayVpName && (
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Adjoint</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{displayVpName}</span>
                    </div>
                )}
                <div className="h-px bg-slate-200/50 my-2" />
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Effectif</span>
                    <Badge variant="outline" className="text-[9px] font-black px-2 py-0.5">{department.memberCount}</Badge>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(department); // Opens Report Hub directly
                    }}
                    className="flex-1 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                    Rapport Rapide
                </Button>
                <Button variant="ghost" className="flex-1 text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/[0.02] text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                    Ouvrir le Hub
                </Button>
            </div>
        </Card>
    );
};

export default DepartmentCard;
