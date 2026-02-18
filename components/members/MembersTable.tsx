import React from 'react';
import { Member } from '../../types';
import { PencilIcon, PhoneIcon } from '../icons/Icons';
import Badge from '../ui/Badge';

interface MembersTableProps {
    members: Member[];
    onEdit: (member: Member) => void;
}

const MembersTable: React.FC<MembersTableProps> = ({ members, onEdit }) => {
    return (
        <div className="overflow-x-auto bg-white rounded-[2rem] border border-slate-100 shadow-premium">
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100/50">
                        <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Fidèle</th>
                        <th className="px-6 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut & Role</th>
                        <th className="px-6 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Contact</th>
                        <th className="px-6 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Localisation</th>
                        <th className="px-6 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {members.map((member) => (
                        <tr
                            key={member.id}
                            onClick={() => onEdit(member)}
                            className="group hover:bg-indigo-50/10 transition-colors cursor-pointer"
                        >
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={member.avatarUrl}
                                        alt={member.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                                    />
                                    <div>
                                        <h4 className="text-sm font-bold text-primary mb-0.5">{member.name}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.family || 'Famille'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex flex-col items-start gap-2">
                                    <Badge variant={member.status === 'Fidèle' ? 'default' : 'warning'} className="text-[8px] font-black px-3 py-1 uppercase">{member.status}</Badge>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{member.role}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 hidden md:table-cell">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <PhoneIcon className="w-3 h-3" />
                                    </div>
                                    <span className="text-xs font-bold font-mono">{member.phone}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 hidden lg:table-cell">
                                <span className="text-xs font-medium text-slate-500">{member.commune || '-'}</span>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <button className="p-2 rounded-xl text-slate-300 hover:text-primary hover:bg-white hover:shadow-sm transition-all">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {members.length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-20 text-center text-slate-400 text-xs uppercase font-bold tracking-widest opacity-50">Aucun membre trouvé</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MembersTable;
