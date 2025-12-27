import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useUploadBusImage, useBusImages } from '../hooks';
import { SrlStatus } from '../types';

interface Props {
    busId: string;
    busPpu: string;
    problem: string;
    status: SrlStatus;
    requestId: string;
}

export const BusBlock = ({ busId, busPpu, problem, status, requestId }: Props) => {
    const { data: images } = useBusImages(busId);
    const uploadMutation = useUploadBusImage();
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            await uploadMutation.mutateAsync({
                busId: busId,
                file: file
            });
        } catch (error) {
            console.error('Upload failed', error);
            alert('Error al subir imagen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-800">{busPpu}</span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-500 font-mono">
                            {busId.split('-')[0]}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{problem}</p>
                </div>
                {/* Status Badge can go here if needed, but request has status */}
            </div>

            {/* Images Grid */}
            <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidencia / Imágenes</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {images?.map((img) => (
                        <div key={img.id} className="relative aspect-square bg-slate-200 rounded-lg overflow-hidden group">
                            <img
                                src={img.storage_path} // Need to ensure this is a full URL or handle signing. 
                                // Actually API fetchBusImages returns rows. 
                                // Ideally API should return signed URL or public URL.
                                // For now assuming simple path or standard Supabase public/signed URL logic.
                                // If storage_path is just the path, we need to construct the URL.
                                // Assuming API handles it or we construct it.
                                // Let's check api/srlApi.ts later to ensure it returns URL.
                                alt="Evidencia"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button className="text-white p-1 hover:text-red-400">
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Upload Button */}
                    <label className={`
                        flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                     `}>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <Icon name={uploading ? "loader" : "plus"} className={uploading ? "animate-spin text-blue-500" : "text-slate-400"} size={24} />
                        <span className="text-xs text-slate-500 mt-1 font-medium">Subir</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
