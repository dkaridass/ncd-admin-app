import React, { useState, useRef } from 'react';
import PageTransition from '../components/layout/PageTransition';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { useDocuments } from '../hooks/useDocuments';
import { FileTextIcon, DownloadIcon, TrashIcon, PlusIcon, InformationCircleIcon } from '../components/icons/Icons';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const DocumentsPage: React.FC = () => {
    const { currentUser, hasPermission } = useData();
    const { documents, isLoading, isUploading, uploadDocument, deleteDocument } = useDocuments(currentUser?.id, currentUser?.role);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Only allow admins
    if (!hasPermission('MANAGE_SETTINGS')) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Accès refusé. Réservé aux administrateurs.</p>
            </div>
        );
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = async (file: File) => {
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("❌ Le fichier dépasse la limite de 5 Mo.");
            return;
        }

        // Validate type (PDF/Word)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("❌ Format non autorisé. Veuillez uploader un PDF ou un document Word.");
            return;
        }

        try {
            await uploadDocument(file);
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-md z-50 animate-fade-in';
            toast.innerHTML = `✅ Document "${file.name}" ajouté avec succès`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        } catch (error: any) {
            alert(`❌ Erreur lors de l'upload: ${error.message}`);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (id: string, url: string, name: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le document "${name}" ?`)) return;

        try {
            await deleteDocument(id, url);
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-amber-500 text-white px-6 py-3 rounded-lg shadow-md z-50 animate-fade-in';
            toast.innerHTML = `🗑️ Document supprimé`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        } catch (error: any) {
            alert(`❌ Erreur lors de la suppression: ${error.message}`);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const getFileIcon = (name: string) => {
        if (name.toLowerCase().endsWith('.pdf')) {
            return <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><FileTextIcon className="w-5 h-5" /></div>;
        }
        return <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><FileTextIcon className="w-5 h-5" /></div>;
    };

    return (
        <PageTransition>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-primary dark:text-white mb-2">Documents</h2>
                <p className="text-slate-500 dark:text-slate-400">Gérez les documents administratifs de l'église (PDF & Word, Max 5Mo)</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Zone */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-6">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-dark hover:border-primary/50'} ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleChange}
                            />

                            {isUploading ? (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload en cours...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-card-dark flex items-center justify-center text-slate-400 mb-4">
                                        <PlusIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Glissez-déposez un fichier ici</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">PDF ou Word (max. 5 Mo)</p>
                                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                                        Parcourir
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-xs text-blue-800 dark:text-blue-300">
                                <p className="font-bold mb-1">Espace Documentaire Sécurisé</p>
                                <p>Ces documents administratifs sont stockés de manière optimale pour garantir une disponibilité rapide. N'uploadez que des documents officiels destinés au partage avec les responsables.</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Documents List */}
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-dark flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Fichiers ({documents.length})</h3>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-dark max-h-[600px] overflow-y-auto">
                            {isLoading ? (
                                <div className="p-12 text-center text-slate-500">Chargement des documents...</div>
                            ) : documents.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Aucun document stocké.</p>
                                </div>
                            ) : (
                                documents.map((doc) => (
                                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4 hidden sm:flex">
                                            {getFileIcon(doc.name)}
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{doc.name}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span>{formatSize(doc.size)}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {doc.uploadedAt ? formatDistanceToNow(
                                                            doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt),
                                                            { addSuffix: true, locale: fr }
                                                        ) : 'Récemment'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Télécharger"
                                            >
                                                <DownloadIcon className="w-5 h-5" />
                                            </a>
                                            <button
                                                onClick={() => doc.id && handleDelete(doc.id, doc.url, doc.name)}
                                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </PageTransition>
    );
};

export default DocumentsPage;
