import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { AseoFilters, AseoRegistroViewModel } from './types';

const MOCK_ASEO: AseoRegistroViewModel[] = [
  {
    id: 'ai-1',
    area: 'interior',
    responsable: 'Equipo Aseo 1',
    fecha: '2023-12-04T08:00:00Z',
    estado: 'pendiente',
    observaciones: 'Pendiente zona comedor',
    terminal: 'EL_ROBLE',
  },
  {
    id: 'ae-1',
    area: 'exterior',
    responsable: 'Equipo Aseo 2',
    fecha: '2023-12-03T15:00:00Z',
    estado: 'completado',
    observaciones: 'Patio listo',
    terminal: 'LA_REINA',
  },
  {
    id: 'ar-1',
    area: 'rodillo',
    responsable: 'Equipo Rodillo',
    fecha: '2023-12-02T17:00:00Z',
    estado: 'pendiente',
    terminal: 'EL_SALTO',
  },
];

export const getAseoAdapter = (area: AseoRegistroViewModel['area']) =>
  createMockListAdapter<AseoRegistroViewModel, AseoFilters>(
    MOCK_ASEO.filter((registro) => registro.area === area),
    (row, filters) => {
      const matchEstado = filters?.estado && filters.estado !== 'todos' ? row.estado === filters.estado : true;
      return matchEstado;
    },
  );
