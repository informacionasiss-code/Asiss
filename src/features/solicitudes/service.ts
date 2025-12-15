import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { SolicitudFilters, SolicitudViewModel } from './types';

const MOCK_SOLICITUDES: SolicitudViewModel[] = [
  { id: 's-1', solicitante: 'Ana Pérez', tipo: 'Materiales', fecha: '2023-12-04', estado: 'abierta', terminal: 'EL_ROBLE' },
  { id: 's-2', solicitante: 'Carlos Vega', tipo: 'Personal', fecha: '2023-12-03', estado: 'en_proceso', terminal: 'LA_REINA' },
  { id: 's-3', solicitante: 'Laura Soto', tipo: 'Tecnología', fecha: '2023-12-02', estado: 'cerrada', terminal: 'EL_SALTO' },
];

export const solicitudesAdapter = createMockListAdapter<SolicitudViewModel, SolicitudFilters>(
  MOCK_SOLICITUDES,
  (row, filters) => {
    const matchEstado = filters?.estado && filters.estado !== 'todas' ? row.estado === filters.estado : true;
    return matchEstado;
  },
);
