import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadResult {
    url: string;
    fileName: string;
}

export const useSupabaseUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Uploads a file to a specific folder in the church-docs bucket
     * @param file The file to upload
     * @param folder The target folder (e.g., 'finances', 'reports')
     * @param allowedTypes Array of allowed MIME types (optional)
     * @param maxSizeInMB Maximum allowed size in MB (default 5MB)
     * @returns Promise resolving to an object with { url, fileName }
     */
    const uploadFile = async (
        file: File,
        folder: string,
        allowedTypes?: string[],
        maxSizeInMB: number = 5
    ): Promise<UploadResult> => {
        setIsUploading(true);
        setError(null);

        try {
            // 1. Validation
            if (file.size > maxSizeInMB * 1024 * 1024) {
                throw new Error(`Le fichier dépasse la limite de ${maxSizeInMB} Mo.`);
            }

            if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
                throw new Error("Format de fichier non autorisé.");
            }

            // 2. Format filename safely
            const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueName = `${Date.now()}-${safeOriginalName}`;
            const filePath = `${folder}/${uniqueName}`;

            // 3. Upload to Supabase
            const { data, error: uploadError } = await supabase.storage
                .from('church-docs')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`Erreur Supabase: ${uploadError.message}`);
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('church-docs')
                .getPublicUrl(data.path);

            return {
                url: publicUrl,
                fileName: file.name
            };

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Deletes a file from Supabase storage using its generated URL
     */
    const deleteFile = async (url: string): Promise<boolean> => {
        try {
            // Extract the path after 'church-docs/'
            const pathPart = url.split('/church-docs/')[1];
            if (!pathPart) return false;

            const { error } = await supabase.storage.from('church-docs').remove([pathPart]);

            if (error) {
                console.error("Erreur lors de la suppression (Supabase):", error);
                return false;
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return {
        isUploading,
        error,
        uploadFile,
        deleteFile
    };
};
