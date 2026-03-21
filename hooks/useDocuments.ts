import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ChurchDocument } from '../types';
import { supabase } from '../lib/supabase';

export const useDocuments = (currentUserId?: string, currentUserRole?: string) => {
    const [documents, setDocuments] = useState<ChurchDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'documents'), orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docsData: ChurchDocument[] = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as ChurchDocument));
            setDocuments(docsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching documents:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const uploadDocument = async (file: File): Promise<void> => {
        if (!currentUserId) throw new Error("User not authenticated");

        setIsUploading(true);
        try {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            const { data, error } = await supabase.storage
                .from('church-docs')
                .upload(`docs/${fileName}`, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw new Error(error.message);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('church-docs')
                .getPublicUrl(data.path);

            await addDoc(collection(db, 'documents'), {
                name: file.name,
                url: publicUrl,
                size: file.size,
                uploadedAt: serverTimestamp(),
                uploadedBy: currentUserId
            });

        } finally {
            setIsUploading(false);
        }
    };

    const deleteDocument = async (documentId: string, url: string) => {
        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(db, 'documents', documentId));

            // 2. Try to delete from Supabase (best effort, using URL to find path)
            try {
                const pathPart = url.split('/church-docs/')[1];
                if (pathPart) {
                    await supabase.storage.from('church-docs').remove([pathPart]);
                }
            } catch (storageError) {
                console.warn("Could not delete from Supabase storage, but removed from Firestore", storageError);
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            throw error;
        }
    };

    return {
        documents,
        isLoading,
        isUploading,
        uploadDocument,
        deleteDocument
    };
};
