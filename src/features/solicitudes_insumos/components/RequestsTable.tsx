import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import {
    fetchSupplyRequests,
    fetchSupplyRequestWithItems,
    markRequestAsRetrieved,
    deleteSupplyRequest,
    getReceiptUrl,
} from '../api/suppliesApi';
import { SupplyRequest, SupplyRequestWithItems } from '../types';
import { formatRequestType, formatStatus } from '../utils/calculations';
import { RequestForm } from './RequestForm';
import { ReceiptUpload } from './ReceiptUpload';

interface Props {
    onRefresh?: () => void;
}

export const RequestsTable = ({ onRefresh }: Props) => {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<SupplyRequestWithItems | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showReceiptUpload, setShowReceiptUpload] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDIENTE' | 'RETIRADO'>('ALL');

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await fetchSupplyRequests(
                filterStatus !== 'ALL' ? { status: filterStatus } : undefined
            );
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [filterStatus]);

    const handleViewDetail = async (requestId: string) => {
        try {
            const data = await fetchSupplyRequestWithItems(requestId);
            setSelectedRequest(data);
            setShowDetail(true);
        } catch (error) {
            console.error('Error loading request detail:', error);
        }
    };

    const handleMarkRetrieved = async (id: string) => {
        try {
            await markRequestAsRetrieved(id);
            await loadRequests();
            onRefresh?.();
        } catch (error) {
            console.error('Error marking as retrieved:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta solicitud?')) return;
        try {
            await deleteSupplyRequest(id);
            await loadRequests();
            onRefresh?.();
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const handleDownloadReceipt = async (path: string) => {
        try {
            const url = await getReceiptUrl(path);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error getting receipt URL:', error);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        loadRequests();
        onRefresh?.();
    };

    const handleReceiptSuccess = () => {
        setShowReceiptUpload(null);
        loadRequests();
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filterStatus === 'ALL'
                                ? 'bg-brand-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterStatus('PENDIENTE')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filterStatus === 'PENDIENTE'
                                ? 'bg-warning-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilterStatus('RETIRADO')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filterStatus === 'RETIRADO'
                                ? 'bg-success-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Retiradas
                    </button>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                    <Icon name="plus" size={18} />
                    <span>Nueva Solicitud</span>
                </button>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <Icon name="inbox" size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No hay solicitudes registradas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Terminal</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Creado por</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {new Date(req.requested_at).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                            {formatRequestType(req.request_type)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{req.terminal}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${req.status === 'PENDIENTE'
                                                        ? 'bg-warning-100 text-warning-700'
                                                        : 'bg-success-100 text-success-700'
                                                    }`}
                                            >
                                                {formatStatus(req.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{req.created_by}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleViewDetail(req.id)}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                                                    title="Ver detalle"
                                                >
                                                    <Icon name="eye" size={16} />
                                                </button>

                                                {req.status === 'PENDIENTE' && (
                                                    <>
                                                        <button
                                                            onClick={() => setShowReceiptUpload(req.id)}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                                                            title="Subir boleta"
                                                        >
                                                            <Icon name="upload" size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkRetrieved(req.id)}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-success-100 hover:text-success-600"
                                                            title="Marcar retirado"
                                                        >
                                                            <Icon name="check" size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(req.id)}
                                                            className="rounded-lg p-1.5 text-slate-500 hover:bg-danger-100 hover:text-danger-600"
                                                            title="Eliminar"
                                                        >
                                                            <Icon name="trash" size={16} />
                                                        </button>
                                                    </>
                                                )}

                                                {req.receipt_path && (
                                                    <button
                                                        onClick={() => handleDownloadReceipt(req.receipt_path!)}
                                                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                                                        title="Ver boleta"
                                                    >
                                                        <Icon name="file" size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative mt-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Nueva Solicitud</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>
                        <RequestForm onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative mt-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Detalle Solicitud</h2>
                            <button
                                onClick={() => {
                                    setShowDetail(false);
                                    setSelectedRequest(null);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Tipo:</span>
                                    <span className="ml-2 font-medium text-slate-800">
                                        {formatRequestType(selectedRequest.request_type)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Estado:</span>
                                    <span
                                        className={`ml-2 font-medium ${selectedRequest.status === 'PENDIENTE'
                                                ? 'text-warning-600'
                                                : 'text-success-600'
                                            }`}
                                    >
                                        {formatStatus(selectedRequest.status)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Terminal:</span>
                                    <span className="ml-2 font-medium text-slate-800">
                                        {selectedRequest.terminal}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Fecha:</span>
                                    <span className="ml-2 font-medium text-slate-800">
                                        {new Date(selectedRequest.requested_at).toLocaleDateString('es-CL')}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            <th className="px-4 py-2">Insumo</th>
                                            <th className="px-4 py-2 text-right">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedRequest.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 text-slate-800">
                                                    {item.supply?.name || 'Desconocido'}
                                                    {item.is_extra && (
                                                        <span className="ml-2 text-xs text-brand-500">(extra)</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-slate-800">
                                                    {item.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Upload Modal */}
            {showReceiptUpload && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative mt-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Subir Boleta</h2>
                            <button
                                onClick={() => setShowReceiptUpload(null)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>
                        <ReceiptUpload
                            requestId={showReceiptUpload}
                            onSuccess={handleReceiptSuccess}
                            onCancel={() => setShowReceiptUpload(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
