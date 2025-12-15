import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { filterByTerminalContext } from '../../shared/utils/terminal';
import { PersonalFilters, PersonalViewModel } from './types';

const MOCK_PERSONAL: PersonalViewModel[] = [
  {
    id: 'p-1',
    nombre: 'Ana Pérez',
    rol: 'Supervisora',
    turno: 'Mañana',
    status: 'activo',
    terminal: 'EL_ROBLE',
    actualizadoEl: '2023-12-02',
  },
  {
    id: 'p-2',
    nombre: 'Carlos Vega',
    rol: 'Coordinador',
    turno: 'Tarde',
    status: 'licencia',
    terminal: 'LA_REINA',
    actualizadoEl: '2023-12-01',
  },
  {
    id: 'p-3',
    nombre: 'Laura Soto',
    rol: 'Operaciones',
    turno: 'Noche',
    status: 'vacaciones',
    terminal: 'EL_SALTO',
    actualizadoEl: '2023-11-29',
  },
  {
    id: 'p-4',
    nombre: 'Diego Araya',
    rol: 'Seguridad',
    turno: 'Mañana',
    status: 'activo',
    terminal: 'LO_ECHEVERS',
    actualizadoEl: '2023-12-03',
  },
  {
    id: 'p-5',
    nombre: 'Marcela Fuentes',
    rol: 'Operaciones',
    turno: 'Tarde',
    status: 'activo',
    terminal: 'COLO_COLO',
    actualizadoEl: '2023-12-04',
  },
];

export const personalAdapter = createMockListAdapter<PersonalViewModel, PersonalFilters>(
  MOCK_PERSONAL,
  (row, filters) => {
    const matchesStatus = filters?.status && filters.status !== 'todos' ? row.status === filters.status : true;
    const matchesSearch = filters?.search ? row.nombre.toLowerCase().includes(filters.search.toLowerCase()) : true;
    return matchesStatus && matchesSearch;
  },
);

export const getPersonalForTerminal = (terminalContext: Parameters<typeof filterByTerminalContext>[1]) =>
  filterByTerminalContext(MOCK_PERSONAL, terminalContext);
