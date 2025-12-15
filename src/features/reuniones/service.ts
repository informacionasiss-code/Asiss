import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { ReunionFilters, ReunionViewModel } from './types';

const MOCK_REUNIONES: ReunionViewModel[] = [
  {
    id: 'r-1',
    tema: 'Coordinación semanal',
    fecha: '2023-12-04T09:00:00Z',
    responsable: 'Ana Pérez',
    participantes: 8,
    estado: 'agendada',
    terminal: 'EL_ROBLE',
  },
  {
    id: 'r-2',
    tema: 'Operación nocturna',
    fecha: '2023-12-03T18:00:00Z',
    responsable: 'Carlos Vega',
    participantes: 6,
    estado: 'en_curso',
    terminal: 'LA_REINA',
  },
  {
    id: 'r-3',
    tema: 'Revisión de seguridad',
    fecha: '2023-12-01T15:30:00Z',
    responsable: 'Laura Soto',
    participantes: 5,
    estado: 'cerrada',
    terminal: 'EL_SALTO',
  },
];

export const reunionesAdapter = createMockListAdapter<ReunionViewModel, ReunionFilters>(
  MOCK_REUNIONES,
  (row, filters) => {
    const matchesEstado = filters?.estado && filters.estado !== 'todas' ? row.estado === filters.estado : true;
    return matchesEstado;
  },
);
