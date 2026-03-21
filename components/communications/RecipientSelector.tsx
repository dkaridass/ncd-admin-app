import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Member, Department } from '../../types';

interface Props {
    members: Member[];
    departments: Department[];
    onSelectionChange: (selectedIds: string[]) => void;
}

const RecipientSelector: React.FC<Props> = ({ members, departments, onSelectionChange }) => {
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
    const [customSelected, setCustomSelected] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Calculate selected members
    const selectedMembers = useMemo(() => {
        if (selectAll) {
            return members.map(m => m.id);
        }

        const deptMembers = members
            .filter(m => m.family && selectedDepts.includes(m.family))
            .map(m => m.id);

        // Combine department and custom selections
        return [...new Set([...deptMembers, ...customSelected])];
    }, [selectAll, selectedDepts, customSelected, members]);

    // Update parent when selection changes
    React.useEffect(() => {
        onSelectionChange(selectedMembers);
    }, [selectedMembers, onSelectionChange]);

    const handleSelectAll = () => {
        const newValue = !selectAll;
        setSelectAll(newValue);
        if (newValue) {
            setSelectedDepts([]);
            setCustomSelected([]);
        }
    };

    const handleDeptToggle = (deptId: string) => {
        setSelectAll(false);
        setSelectedDepts(prev =>
            prev.includes(deptId)
                ? prev.filter(id => id !== deptId)
                : [...prev, deptId]
        );
    };

    const getMemberCount = (deptId: string) => {
        return members.filter(m => m.family === deptId).length;
    };

    return (
        <>
            <Card className="border-none shadow-soft dark:shadow-none rounded-2xl p-8">
                <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-6">Sélectionner les Destinataires</h3>

                {/* Select All */}
                <div className="mb-6 p-4 bg-primary/5 rounded-xl border-2 border-primary dark:border-white/20/10">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="w-5 h-5 rounded border-2 border-primary dark:border-white/20 text-primary dark:text-white focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex-1">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">Tous les Membres</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {members.length} membres actifs
                            </p>
                        </div>
                    </label>
                </div>

                {/* Department Selection */}
                <div className="space-y-3 mb-6">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">Par Département</label>
                    {departments.map((dept) => (
                        <label
                            key={dept.id}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedDepts.includes(dept.id) ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-dark hover:border-slate-300 bg-card dark:bg-card-dark' }`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedDepts.includes(dept.id)}
                                onChange={() => handleDeptToggle(dept.id)}
                                disabled={selectAll}
                                className="w-5 h-5 rounded border-2 border-primary dark:border-white/20 text-primary dark:text-white focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-bold text-slate-800 dark:text-white">{dept.name}</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {getMemberCount(dept.id)} membres
                                </p>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Selection Summary */}
                <div className="pt-6 border-t border-slate-200 dark:border-dark">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Destinataires Sélectionnés</span>
                        <span className="text-2xl font-black text-primary dark:text-white">
                            {selectedMembers.length}
                        </span>
                    </div>

                    <Button
                        onClick={() => setShowPreview(true)}
                        disabled={selectedMembers.length === 0}
                        className="w-full py-3 rounded-xl bg-slate-100 text-primary dark:text-white font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        👁️ Prévisualiser les Destinataires
                    </Button>
                </div>
            </Card>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-dark">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Destinataires ({selectedMembers.length})
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-2">
                                {members
                                    .filter(m => selectedMembers.includes(m.id))
                                    .map(member => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{member.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {member.phone} • {member.email}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-dark">
                            <Button
                                onClick={() => setShowPreview(false)}
                                className="w-full py-3 rounded-xl bg-slate-200 text-slate-800 dark:text-white font-bold hover:bg-slate-300"
                            >
                                Fermer
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};

export default RecipientSelector;
