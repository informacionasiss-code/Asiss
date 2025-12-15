import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { TareaFilters, TareaViewModel } from './types';

const MOCK_TAREAS: TareaViewModel[] = [
  {
    id: 't-1',
    titulo: 'Inventario patio',
    responsable: 'Ana Pérez',
    prioridad: 'alta',
    estado: 'pendiente',
    vencimiento: '2023-12-06',
    terminal: 'EL_ROBLE',
  },
  {
    id: 't-2',
    titulo: 'Actualizar checklists',
    responsable: 'Carlos Vega',
    prioridad: 'media',
    estado: 'en_progreso',
    vencimiento: '2023-12-07',
    terminal: 'EL_SALTO',
  },
  {
    id: 't-3',
    titulo: 'Control de EPIs',
    responsable: 'Laura Soto',
    prioridad: 'baja',
    estado: 'completada',
    vencimiento: '2023-11-30',
    terminal: 'COLO_COLO',
  },
];

export const tareasAdapter = createMockListAdapter<TareaViewModel, TareaFilters>(
  MOCK_TAREAS,
  (row, filters) => {
    const matchEstado = filters?.estado && filters.estado !== 'todas' ? row.estado === filters.estado : true;
    const matchPrioridad = filters?.prioridad && filters.prioridad !== 'todas' ? row.prioridad === filters.prioridad : true;
    return matchEstado && matchPrioridad;
  },
);
