import React from 'react';
import { Member } from '../../types';
import Badge from '../ui/Badge';
import { PhoneIcon, UserIcon, HeartIcon } from '../icons/Icons';

import { useData } from '../../context/DataContext';

interface MemberCardProps {
    member: Member;
    onClick: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
    const { departments } = useData();
    
    // Defensive checks: ensure member has required fields
    if (!member || !member.name) {
        console.warn('MemberCard: Invalid member data', member);
        return null;
    }
    
    const departmentName = member.primaryDepartmentId
        ? departments.find(d => d.id === member.primaryDepartmentId)?.name
        : null;

    // Dynamic border based on status
    const statusBorder = member.status === 'Fidèle' ? 'border-emerald-500/50' :
        member.status === 'Visiteur' ? 'border-amber-500/50' :
            'border-slate-200';

    return (
        <div
            onClick={onClick}
            className={`group relative bg-white rounded-xl p-6 border ${statusBorder} shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all cursor-pointer overflow-hidden`}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -z-0 transition-transform group-hover:scale-110 group-hover:bg-primary/5" />

            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-6">
                    <img
                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                        alt={member.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:shadow-primary/20 transition-all"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-sm">
                        <Badge variant={member.gender === 'Homme' ? 'info' : 'warning'} className="text-[8px] px-2 py-0.5 uppercase">
                            {member.gender === 'Homme' ? 'M' : 'F'}
                        </Badge>
                    </div>
                </div>

                {/* Info */}
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors line-clamp-1 w-full">
                    {member.name}
                </h3>
                {member.churchFunction && member.churchFunction !== 'Aucune' && (
                    <div className="mb-2">
                        <Badge variant="neutral" className="bg-slate-800 text-white text-[9px] uppercase tracking-widest px-3 py-1 scale-90">
                            {member.churchFunction}
                        </Badge>
                    </div>
                )}

                <div className="flex flex-col gap-1 items-center mb-6 w-full px-2">
                    {/* Role / Qualité */}
                    {member.role !== 'Fidèle' && (
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full mb-1">
                            {member.role}
                        </span>
                    )}

                    {/* Primary Department */}
                    {departmentName && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-full">
                            {departmentName}
                        </span>
                    )}

                    {/* Leadership/Responsibilities */}
                    {member.responsibilities && member.responsibilities.length > 0 && (
                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-tight text-center line-clamp-2 leading-tight">
                            {member.responsibilities.join(' • ')}
                        </span>
                    )}
                </div>

                {/* Footer Details */}
                <div className="w-full pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Contact</span>
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3 text-slate-300" />
                            {member.phone || 'Non renseigné'}
                        </span>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Statut</span>
                        <Badge variant={
                            member.followUpStatus === 'Nouveau' ? 'danger' :
                                member.followUpStatus === 'Intégré' ? 'success' :
                                    'neutral'
                        } className="text-[8px] px-2 py-0.5 uppercase tracking-tighter">
                            {member.followUpStatus || member.status || 'Nouveau'}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberCard;
