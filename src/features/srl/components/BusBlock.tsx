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
    const { data: images = [] } = useBusImages(busId);
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
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/60 group">
            {/* Decorative gradient accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-lg">
                                <Icon name="truck" size={20} />
                            </div>
                            <div>
                                <span className="font-black text-xl text-slate-900 tracking-tight">{busPpu}</span>
                                <span className="ml-2 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-500 font-mono shadow-sm">
                                    ID: {busId.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pl-13">{problem}</p>
                    </div>
                </div>

                {/* Images Grid */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Icon name="image" size={14} className="text-slate-400" />
                            Evidencia Fotográfica
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                            {images.length} foto{images.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {images.map((img) => (
                            <div key={img.id} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden group/img border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
                                <img
                                    src={img.publicUrl}
                                    alt="Evidencia"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                    <button
                                        className="text-white/90 hover:text-red-400 p-2 bg-black/30 rounded-lg backdrop-blur-sm transition-colors"
                                        onClick={() => {/* TODO: Delete logic */ }}
                                    >
                                        <Icon name="trash" size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Upload Button */}
                        <label className={`
                            relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                            ${uploading
                                ? 'border-blue-400 bg-blue-50 opacity-75 pointer-events-none'
                                : 'border-slate-300 hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 group/upload'
                            }
                         `}>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                    ${uploading
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-400 group-hover/upload:bg-blue-500 group-hover/upload:text-white group-hover/upload:scale-110'
                                    }
                                `}>
                                    <Icon
                                        name={uploading ? "loader" : "plus"}
                                        className={uploading ? "animate-spin" : ""}
                                        size={20}
                                    />
                                </div>
                                <span className={`
                                    text-[10px] font-bold mt-2 transition-colors
                                    ${uploading ? 'text-blue-600' : 'text-slate-500 group-hover/upload:text-blue-600'}
                                `}>
                                    {uploading ? 'Subiendo...' : 'Subir'}
                                </span>
                            </div>

                            {/* Animated background on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-indigo-400/0 group-hover/upload:from-blue-400/10 group-hover/upload:to-indigo-400/10 transition-all duration-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
