import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { AsistenciaFilters, AsistenciaViewModel } from './types';

const MOCK_ASISTENCIA: AsistenciaViewModel[] = [
  { id: 'a-1', colaborador: 'Ana Pérez', fecha: '2023-12-04', turno: 'Mañana', estado: 'presente', terminal: 'EL_ROBLE' },
  { id: 'a-2', colaborador: 'Carlos Vega', fecha: '2023-12-04', turno: 'Tarde', estado: 'atraso', terminal: 'LA_REINA' },
  { id: 'a-3', colaborador: 'Laura Soto', fecha: '2023-12-04', turno: 'Noche', estado: 'ausente', terminal: 'EL_SALTO' },
];

export const asistenciaAdapter = createMockListAdapter<AsistenciaViewModel, AsistenciaFilters>(
  MOCK_ASISTENCIA,
  (row, filters) => {
    const matchEstado = filters?.estado && filters.estado !== 'todos' ? row.estado === filters.estado : true;
    return matchEstado;
  },
);
