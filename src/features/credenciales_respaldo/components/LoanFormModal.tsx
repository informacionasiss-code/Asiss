import { useState, useEffect, useRef, FormEvent } from 'react';
import { X, Printer, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LoanFormValues, BackupCard, REASON_OPTIONS, INVENTORY_TERMINALS } from '../types';
import { fetchAvailableCards } from '../api/backupApi';
import { validateRut, formatRut, cleanRut } from '../utils/rut';
import { supabase } from '../../../shared/lib/supabaseClient';
import { terminalOptions } from '../../../shared/utils/terminal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: LoanFormValues) => Promise<void>;
    isLoading?: boolean;
    supervisorName: string;
}

export const LoanFormModal = ({ isOpen, onClose, onSubmit, isLoading, supervisorName }: Props) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [form, setForm] = useState<LoanFormValues>({
        person_rut: '',
        person_name: '',
        person_cargo: '',
        person_terminal: 'EL_ROBLE',
        person_turno: '',
        person_horario: '',
        person_contacto: '',
        boss_email: '',
        reason: 'PERDIDA',
        requested_at: new Date().toISOString().split('T')[0],
        card_id: '',
        discount_applied: true,
        discount_amount: 5000,
        send_emails: true,
        created_by_supervisor: supervisorName,
    });
    const [selectedCardTerminal, setSelectedCardTerminal] = useState<string>('');
    const [rutError, setRutError] = useState('');

    // Fetch available cards
    const { data: availableCards = [] } = useQuery({
        queryKey: ['backup-cards-available', selectedCardTerminal],
        queryFn: () => fetchAvailableCards(selectedCardTerminal || undefined),
        enabled: isOpen,
    });

    // RUT lookup from staff table
    const handleRutBlur = async () => {
        const cleanedRut = cleanRut(form.person_rut);
        if (!cleanedRut) return;

        if (!validateRut(cleanedRut)) {
            setRutError('RUT invalido');
            return;
        }
        setRutError('');

        // Try to find in staff table
        const { data: staff } = await supabase
            .from('staff')
            .select('nombre, cargo, terminal_code, turno, horario, contacto')
            .eq('rut', cleanedRut)
            .single();

        if (staff) {
            setForm((prev) => ({
                ...prev,
                person_rut: formatRut(cleanedRut),
                person_name: staff.nombre,
                person_cargo: staff.cargo || '',
                person_terminal: staff.terminal_code || 'EL_ROBLE',
                person_turno: staff.turno || '',
                person_horario: staff.horario || '',
                person_contacto: staff.contacto || '',
            }));
        } else {
            setForm((prev) => ({ ...prev, person_rut: formatRut(cleanedRut) }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateRut(cleanRut(form.person_rut))) {
            setRutError('RUT invalido');
            return;
        }
        await onSubmit(form);
    };

    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const terminalName = terminalOptions.find(t => t.value === form.person_terminal)?.label || form.person_terminal;
                printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Autorizacion de Descuento</title>
            <style>
              @page { size: letter; margin: 1.5cm; }
              body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; max-width: 700px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #c00; padding-bottom: 10px; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #c00; }
              .title-bar { background: #c00; color: white; padding: 8px 15px; font-weight: bold; text-align: center; margin-bottom: 20px; }
              .field-row { display: flex; margin-bottom: 10px; }
              .field-label { font-weight: bold; min-width: 180px; }
              .field-value { border-bottom: 1px solid #333; flex: 1; padding-left: 10px; }
              .authorization-box { border: 2px solid #333; padding: 15px; margin: 20px 0; text-align: center; }
              .amount { font-size: 18px; font-weight: bold; }
              .signature-section { margin-top: 40px; border-top: 2px solid #333; padding-top: 15px; }
              .signature-line { border-bottom: 1px solid #333; height: 60px; margin: 30px 0 5px 0; }
              .observations-box { border: 1px solid #333; min-height: 80px; margin: 15px 0; }
              .observations-header { background: #666; color: white; padding: 5px 10px; font-weight: bold; text-align: center; }
              .footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #333; padding-top: 10px; }
              .detail-section { margin-top: 20px; border-top: 2px solid #333; padding-top: 15px; }
              .detail-title { font-weight: bold; font-style: italic; margin-bottom: 10px; }
              .detail-table { width: 100%; border-collapse: collapse; }
              .detail-table th, .detail-table td { border: 1px solid #333; padding: 5px 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">RBU</div>
              <div style="text-align: right; color: #c00; font-weight: bold;">RBU Santiago.</div>
            </div>
            
            <div class="title-bar">Autorizacion de Descuento</div>
            
            <div class="field-row">
              <span class="field-label">NOMBRE DEL TRABAJADOR:</span>
              <span class="field-value">${form.person_name || ''}</span>
            </div>
            
            <div class="field-row">
              <span class="field-label">RUT:</span>
              <span class="field-value" style="max-width: 150px;">${form.person_rut || ''}</span>
              <span class="field-label" style="margin-left: 20px;">Cargo desempenado:</span>
              <span class="field-value">${form.person_cargo || ''}</span>
            </div>
            
            <div class="authorization-box">
              <p style="font-weight: bold;">EL TRABAJADOR INDIVIDUALIZADO AUTORIZA EN ESTE ACTO</p>
              <p class="amount">EL DESCUENTO DE: $ ${form.discount_amount.toLocaleString('es-CL')}</p>
              <p style="font-weight: bold;">POR CONCEPTO DE: ${form.reason === 'PERDIDA' ? 'Perdida Credencial' : 'Deterioro Credencial'}</p>
              
              <div style="display: flex; justify-content: flex-end; gap: 20px; margin-top: 15px;">
                <div style="text-align: right;">
                  <p>A descontar en: <strong>1 Cuotas</strong></p>
                  <p>A contar de: <strong>Mes en curso</strong></p>
                  <p>Valor de cada cuota: <strong>$ ${form.discount_amount.toLocaleString('es-CL')}</strong></p>
                </div>
              </div>
            </div>
            
            <div class="signature-section">
              <p style="font-weight: bold; font-style: italic;">Firma y Rut del trabajador</p>
              <p style="float: right;">Fecha: <strong>${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
              <div style="clear: both;"></div>
              <p style="font-size: 10px; margin-top: 10px;">
                El trabajador, mediante el presente instrumento, otorga mandato expreso a REDBUS URBANO S.A. para que descuente de sus remuneraciones en las cuotas y plazos indicados la suma indicada en este acto. Asimismo faculta expresamente a REDBUS URBANO S.A., para que en el evento de que por cualquier causa se pusiese termino al contrato de trabajo, descuente el total del saldo adeudado de las indemnizaciones a que tenga derecho y/o otros emolumentos que pudiere tener derecho al termino de la relacion laboral.
              </p>
              <div class="signature-line"></div>
            </div>
            
            <div class="observations-box">
              <div class="observations-header">Observaciones</div>
              <div style="min-height: 60px; padding: 10px;"></div>
            </div>
            
            <div class="footer">
              <p>Av. El Salto 4651, Huechuraba, Santiago.</p>
              <p>Fono: (56 2) 4881800 &nbsp;&nbsp;&nbsp; Fax: (56 2) 4881818</p>
              <p style="text-align: right; font-weight: bold;">RBU SANTIAGO SA</p>
            </div>
            
            <div class="detail-section">
              <p class="detail-title">Detalle Descuento</p>
              <table class="detail-table">
                <tr>
                  <th style="text-align: left;">Concepto</th>
                  <th style="text-align: right;">COSTO</th>
                </tr>
                <tr>
                  <td>${form.reason === 'PERDIDA' ? 'Perdida Credencial' : 'Deterioro Credencial'}</td>
                  <td style="text-align: right;">$${form.discount_amount.toLocaleString('es-CL')}</td>
                </tr>
              </table>
            </div>
          </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            setForm({
                person_rut: '',
                person_name: '',
                person_cargo: '',
                person_terminal: 'EL_ROBLE',
                person_turno: '',
                person_horario: '',
                person_contacto: '',
                boss_email: '',
                reason: 'PERDIDA',
                requested_at: new Date().toISOString().split('T')[0],
                card_id: '',
                discount_applied: true,
                discount_amount: 5000,
                send_emails: true,
                created_by_supervisor: supervisorName,
            });
            setRutError('');
            setSelectedCardTerminal('');
        }
    }, [isOpen, supervisorName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-lg font-semibold text-slate-900">Nuevo Prestamo de Respaldo</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Person Data */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Datos del Trabajador</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">RUT</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className={`input pr-10 ${rutError ? 'border-red-500' : ''}`}
                                            value={form.person_rut}
                                            onChange={(e) => setForm((prev) => ({ ...prev, person_rut: e.target.value }))}
                                            onBlur={handleRutBlur}
                                            placeholder="12.345.678-9"
                                            required
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                    {rutError && <p className="text-xs text-red-500 mt-1">{rutError}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.person_name}
                                        onChange={(e) => setForm((prev) => ({ ...prev, person_name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.person_cargo}
                                        onChange={(e) => setForm((prev) => ({ ...prev, person_cargo: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Terminal</label>
                                    <select
                                        className="input"
                                        value={form.person_terminal}
                                        onChange={(e) => setForm((prev) => ({ ...prev, person_terminal: e.target.value }))}
                                        required
                                    >
                                        {terminalOptions.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Turno</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.person_turno}
                                        onChange={(e) => setForm((prev) => ({ ...prev, person_turno: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Horario</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.person_horario}
                                        onChange={(e) => setForm((prev) => ({ ...prev, person_horario: e.target.value }))}
                                        placeholder="08:00-18:00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Contacto</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.person_contacto}
                                        onChange={(e) => setForm((prev) => ({ ...prev, person_contacto: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Email Jefatura</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={form.boss_email}
                                        onChange={(e) => setForm((prev) => ({ ...prev, boss_email: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Request */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Solicitud</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Motivo</label>
                                    <select
                                        className="input"
                                        value={form.reason}
                                        onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value as typeof form.reason }))}
                                        required
                                    >
                                        {REASON_OPTIONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Fecha Solicitud</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={form.requested_at}
                                        onChange={(e) => setForm((prev) => ({ ...prev, requested_at: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card Selection */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Tarjeta de Respaldo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Terminal de Inventario</label>
                                    <select
                                        className="input"
                                        value={selectedCardTerminal}
                                        onChange={(e) => {
                                            setSelectedCardTerminal(e.target.value);
                                            setForm((prev) => ({ ...prev, card_id: '' }));
                                        }}
                                    >
                                        <option value="">Todos</option>
                                        {INVENTORY_TERMINALS.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Tarjeta Disponible</label>
                                    <select
                                        className="input"
                                        value={form.card_id}
                                        onChange={(e) => setForm((prev) => ({ ...prev, card_id: e.target.value }))}
                                        required
                                    >
                                        <option value="">Seleccionar tarjeta...</option>
                                        {availableCards.map((card) => (
                                            <option key={card.id} value={card.id}>
                                                {card.card_number} ({card.inventory_terminal})
                                            </option>
                                        ))}
                                    </select>
                                    {availableCards.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">No hay tarjetas disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Discount */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Descuento</h3>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.discount_applied}
                                        onChange={(e) => setForm((prev) => ({ ...prev, discount_applied: e.target.checked }))}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700">
                                        Aplicar descuento de ${form.discount_amount.toLocaleString('es-CL')} (1 cuota)
                                    </span>
                                </label>
                                {form.discount_applied && (
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="btn btn-secondary flex items-center gap-2"
                                        disabled={!form.person_name || !form.person_rut}
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir Formulario
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Emails */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Notificaciones</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.send_emails}
                                    onChange={(e) => setForm((prev) => ({ ...prev, send_emails: e.target.checked }))}
                                    className="w-4 h-4 rounded border-slate-300"
                                />
                                <span className="text-sm text-slate-700">Enviar correos al crear</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading || !form.card_id}>
                                {isLoading ? 'Guardando...' : 'Crear Prestamo'}
                            </button>
                        </div>
                    </form>

                    {/* Hidden print template */}
                    <div ref={printRef} className="hidden" />
                </div>
            </div>
        </div>
    );
};
