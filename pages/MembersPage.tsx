
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/layout/PageTransition';
import PermissionGuard from '../components/auth/PermissionGuard';
import { PlusCircleIcon, UsersIcon, HeartIcon } from '../components/icons/Icons';
import { Member, PersonStatus } from '../types';
import MembersTable from '../components/members/MembersTable';
import MemberDrawer from '../components/members/MemberDrawer';
import MemberCard from '../components/members/MemberCard';
import Card from '../components/ui/Card';
import { showSuccess, showError } from '../utils/toast';

const MembersPage: React.FC = () => {
    const { members, addMember, updateMember, deleteMember, language, isLoading } = useData();

    const [activeTab, setActiveTab] = useState<PersonStatus>('Fidèle');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
    const [filterGender, setFilterGender] = useState<'Tous' | 'Homme' | 'Femme'>('Tous');

    const initialFormData: Partial<Member> = {
        name: '',
        role: 'Fidèle',
        status: 'Fidèle',
        gender: 'Homme',
        joinDate: new Date().toISOString().split('T')[0],
        followUpStatus: 'Nouveau'
    };

    const filteredMembers = members.filter(member => {
        // Defensive check: ensure member has required fields
        if (!member || !member.name) {
            console.warn('Member missing name:', member);
            return false;
        }
        
        // Ensure status exists, default to 'Fidèle' if missing
        const memberStatus = member.status || 'Fidèle';
        const matchesTab = memberStatus === activeTab;
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (member.family && member.family.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesGender = filterGender === 'Tous' || member.gender === filterGender;
        
        return matchesTab && matchesSearch && matchesGender;
    });

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setIsDrawerOpen(true);
    };

    const handleAdd = () => {
        setEditingMember({ ...initialFormData, status: activeTab });
        setIsDrawerOpen(true);
    };

    const handleSave = async (data: Partial<Member>) => {
        try {
            // Ensure departmentIds array is set when primaryDepartmentId is assigned
            // Never allow undefined - use empty array or existing value
            const departmentIds = data.primaryDepartmentId 
                ? (data.departmentIds && data.departmentIds.length > 0 
                    ? data.departmentIds.includes(data.primaryDepartmentId) 
                        ? data.departmentIds 
                        : [...data.departmentIds, data.primaryDepartmentId]
                    : [data.primaryDepartmentId])
                : (data.departmentIds || []); // Default to empty array if undefined

            if (data.id) {
                // Update existing member - build clean update object without undefined values
                const updateData: Partial<Member> = {};
                
                // Only include defined values
                Object.keys(data).forEach(key => {
                    const value = (data as any)[key];
                    if (value !== undefined) {
                        (updateData as any)[key] = value;
                    }
                });
                
                // Always set departmentIds explicitly (never undefined)
                updateData.departmentIds = departmentIds;
                
                console.log('📝 Update data before sending:', updateData);
                
                await updateMember(data.id, updateData);
                console.log('✅ Member updated successfully');
                showSuccess('✅ Membre modifié avec succès');
            } else {
                // Create new member - ensure all required fields
                const newMember: Omit<Member, 'id'> = {
                    name: data.name!,
                    status: data.status || 'Fidèle',
                    gender: data.gender || 'Homme',
                    phone: data.phone || '',
                    email: data.email || '',
                    family: data.family || '',
                    role: data.role || 'Fidèle',
                    joinDate: data.joinDate || new Date().toISOString().split('T')[0],
                    avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=1E1B4B&color=fff`,
                    // Optional fields
                    birthDate: data.birthDate || '',
                    civilState: data.civilState,
                    commune: data.commune,
                    whatsapp: data.whatsapp,
                    churchFunction: data.churchFunction,
                    primaryDepartmentId: data.primaryDepartmentId,
                    departmentIds: departmentIds,
                    isBaptised: data.isBaptised || false,
                    followUpStatus: data.followUpStatus || 'Nouveau',
                    isLeader: data.isLeader || false,
                    leadershipLevel: data.leadershipLevel,
                    responsibilities: data.responsibilities
                };
                await addMember(newMember as Member);
                console.log('✅ Member created successfully');
                showSuccess('✅ Membre ajouté avec succès');
            }
            setIsDrawerOpen(false);
            setEditingMember(null);
        } catch (error: any) {
            console.error('❌ Error saving member:', error);
            showError(`Erreur lors de l'enregistrement du membre: ${error.message || 'Erreur inconnue'}`);
            throw error; // Re-throw so MemberDrawer can handle loading state
        }
    };

    return (
        <PageTransition>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end mb-10 gap-6">
                <div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-primary font-display tracking-tight leading-none mb-4 uppercase italic">Répertoire</h2>
                    <div className="flex gap-4 md:gap-8 border-b border-slate-100 lg:border-none">
                        <button onClick={() => setActiveTab('Fidèle')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'Fidèle' ? 'border-secondary text-primary' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>
                            {language === 'ln' ? 'BASALELI' : 'Fidèles'}
                        </button>
                        <button onClick={() => setActiveTab('Visiteur')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'Visiteur' ? 'border-secondary text-primary' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>
                            {language === 'ln' ? 'BAPAYA' : 'Identification'}
                        </button>
                        <button onClick={() => setActiveTab('Archivé')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest pb-3 border-b-4 transition-all ${activeTab === 'Archivé' ? 'border-secondary text-primary' : 'border-transparent text-slate-300 hover:text-slate-400'}`}>
                            Archives
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
                    <div className="flex gap-2 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                        {['Tous', 'Homme', 'Femme'].map(g => (
                            <button
                                key={g}
                                onClick={() => setFilterGender(g as any)}
                                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all ${filterGender === g ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 sm:w-64">
                        <input
                            type="text"
                            placeholder="Recherche..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-6 pr-6 py-3 rounded-full border border-slate-200 bg-white text-xs focus:ring-4 focus:ring-primary/5 focus:border-primary/20 font-bold transition-all outline-none"
                        />
                    </div>

                    <PermissionGuard permission="EDIT_MEMBERS">
                        <Button onClick={handleAdd} className="rounded-full shadow-premium py-3 px-6 bg-primary text-white hover:bg-primary-light border-none whitespace-nowrap text-[10px] uppercase font-black tracking-widest">
                            <PlusCircleIcon className="w-4 h-4 mr-2" />
                            {language === 'ln' ? 'KOKOMISA' : 'Nouveau'}
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {(() => {
                if (isLoading && members.length === 0) {
                    return (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    );
                }
                
                if (filteredMembers.length === 0) {
                    return (
                        <Card className="p-12 text-center border-2 border-dashed border-slate-200">
                            <UsersIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-400 mb-2">
                                {activeTab === 'Fidèle' ? 'Aucun fidèle enregistré' :
                                 activeTab === 'Visiteur' ? 'Aucun visiteur enregistré' :
                                 'Aucun membre archivé'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                {activeTab === 'Fidèle' ? 'Commencez par ajouter votre premier fidèle' :
                                 activeTab === 'Visiteur' ? 'Aucun visiteur n\'a été enregistré pour le moment' :
                                 'Aucun membre n\'a été archivé'}
                            </p>
                            <PermissionGuard permission="EDIT_MEMBERS">
                                <Button onClick={handleAdd} className="bg-primary text-white">
                                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                                    Ajouter le premier membre
                                </Button>
                            </PermissionGuard>
                        </Card>
                    );
                }
                
                return activeTab === 'Fidèle' || activeTab === 'Archivé' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
                        {filteredMembers.map(member => (
                            <MemberCard key={member.id} member={member} onClick={() => handleEdit(member)} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-none bg-blue-50/50 p-6 rounded-[2rem] flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <HeartIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-blue-900 uppercase">Suivi des Nouveaux</h3>
                                <p className="text-xs text-blue-700/60">Gérez les visiteurs et leur parcours d'intégration</p>
                            </div>
                        </Card>

                        {filteredMembers.map(member => (
                            <MemberCard key={member.id} member={member} onClick={() => handleEdit(member)} />
                        ))}
                    </div>
                );
            })()}

            <MemberDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                member={editingMember}
                onSave={handleSave}
                onDelete={deleteMember}
                isEditing={!!editingMember?.id}
            />
        </PageTransition>
    );
};

export default MembersPage;

