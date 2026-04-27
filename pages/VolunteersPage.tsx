import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/layout/PageTransition';
import { Member } from '../types';
import { useNavigate } from 'react-router-dom';

const VolunteersPage: React.FC = () => {
  const { members, departments, updateMember } = useData();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Actif' | 'Inactif' | 'En pause'>('Tous');
  const [departmentFilter, setDepartmentFilter] = useState<string>('Tous');

  // Get all volunteers
  const volunteers = useMemo(() => {
    return members.filter(m => m.isVolunteer === true);
  }, [members]);

  // Filter volunteers
  const filteredVolunteers = useMemo(() => {
    let filtered = volunteers;

    if (statusFilter !== 'Tous') {
      filtered = filtered.filter(v => v.volunteerStatus === statusFilter);
    }

    if (departmentFilter !== 'Tous') {
      filtered = filtered.filter(v => v.volunteerDepartmentId === departmentFilter);
    }

    return filtered;
  }, [volunteers, statusFilter, departmentFilter]);

  // Group by department
  const volunteersByDepartment = useMemo(() => {
    const grouped: Record<string, Member[]> = {};
    filteredVolunteers.forEach(volunteer => {
      const deptId = volunteer.volunteerDepartmentId || 'Sans département';
      if (!grouped[deptId]) {
        grouped[deptId] = [];
      }
      grouped[deptId].push(volunteer);
    });
    return grouped;
  }, [filteredVolunteers]);

  const getDepartmentName = (deptId: string) => {
    if (deptId === 'Sans département') return 'Sans département';
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Département inconnu';
  };

  const statusColors: Record<string, string> = {
    'Actif': 'bg-green-100 text-green-700',
    'Inactif': 'bg-gray-100 text-gray-700',
    'En pause': 'bg-yellow-100 text-yellow-700',
  };

  const handleToggleStatus = async (member: Member, newStatus: 'Actif' | 'Inactif' | 'En pause') => {
    try {
      await updateMember(member.id, { volunteerStatus: newStatus });
    } catch (error) {
      console.error("Error updating volunteer status:", error);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bénévoles</h2>
          <p className="text-gray-500 text-sm">
            {volunteers.length} bénévole{volunteers.length > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrer par Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="En pause">En pause</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrer par Département</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="block w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="Tous">Tous les départements</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredVolunteers.length === 0 && (
        <Card className="p-12 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50 shadow-none">
          <p className="text-slate-400 mb-2 font-medium">
            {volunteers.length === 0
              ? "Aucun bénévole enregistré"
              : "Aucun bénévole ne correspond aux filtres"}
          </p>
          <p className="text-sm text-gray-400">
            {volunteers.length === 0
              ? "Marquez des membres comme bénévoles depuis la page Membres"
              : "Essayez de modifier les filtres"}
          </p>
        </Card>
      )}

      {/* Volunteers by Department */}
      {Object.keys(volunteersByDepartment).length > 0 && (
        <div className="space-y-6">
          {Object.entries(volunteersByDepartment).map(([deptId, deptVolunteers]) => {
            const items = deptVolunteers as Member[];
            return (
              <Card key={deptId} className="p-6 rounded-lg bg-white border border-slate-200 shadow-admin">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">
                    {getDepartmentName(deptId)}
                  </h3>
                  <Badge variant="primary">{items.length} bénévole{items.length > 1 ? 's' : ''}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(volunteer => (
                    <div
                      key={volunteer.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/members?memberId=${volunteer.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:text-white text-sm flex items-center justify-center font-bold mr-3">
                            {volunteer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{volunteer.name}</h4>
                            <p className="text-xs text-gray-500">{volunteer.role}</p>
                          </div>
                        </div>
                      </div>

                      {volunteer.volunteerRoles && volunteer.volunteerRoles.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1">
                            {volunteer.volunteerRoles.map((role, idx) => (
                              <Badge key={idx} variant="ghost" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <Badge className={statusColors[volunteer.volunteerStatus || 'Actif']}>
                          {volunteer.volunteerStatus || 'Actif'}
                        </Badge>
                        {volunteer.volunteerStartDate && (
                          <span className="text-xs text-gray-500">
                            Depuis {new Date(volunteer.volunteerStartDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* All Volunteers List (if no department grouping) */}
      {Object.keys(volunteersByDepartment).length === 0 && filteredVolunteers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map(volunteer => (
            <Card
              key={volunteer.id}
              className="p-4 rounded-lg bg-white border border-slate-200 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/members?memberId=${volunteer.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary dark:text-white text-sm flex items-center justify-center font-bold mr-3">
                    {volunteer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{volunteer.name}</h4>
                    <p className="text-xs text-gray-500">{volunteer.role}</p>
                  </div>
                </div>
              </div>

              {volunteer.volunteerRoles && volunteer.volunteerRoles.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {volunteer.volunteerRoles.map((role, idx) => (
                      <Badge key={idx} variant="ghost" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <Badge className={statusColors[volunteer.volunteerStatus || 'Actif']}>
                  {volunteer.volunteerStatus || 'Actif'}
                </Badge>
                {volunteer.volunteerStartDate && (
                  <span className="text-xs text-gray-500">
                    Depuis {new Date(volunteer.volunteerStartDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
};

export default VolunteersPage;
