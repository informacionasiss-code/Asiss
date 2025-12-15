import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { CredencialFilters, CredencialViewModel } from './types';

const MOCK_CREDENCIALES: CredencialViewModel[] = [
  {
    id: 'c-1',
    sistema: 'CRM',
    responsable: 'Ana Pérez',
    venceEl: '2024-01-10',
    estado: 'vigente',
    terminal: 'EL_ROBLE',
  },
  {
    id: 'c-2',
    sistema: 'Supabase',
    responsable: 'Carlos Vega',
    venceEl: '2023-12-20',
    estado: 'por_vencer',
    terminal: 'LA_REINA',
  },
  {
    id: 'c-3',
    sistema: 'Correo',
    responsable: 'Laura Soto',
    venceEl: '2023-12-05',
    estado: 'revocada',
    terminal: 'EL_SALTO',
  },
];

export const credencialesAdapter = createMockListAdapter<CredencialViewModel, CredencialFilters>(
  MOCK_CREDENCIALES,
  (row, filters) => {
    const matchEstado = filters?.estado && filters.estado !== 'todas' ? row.estado === filters.estado : true;
    return matchEstado;
  },
);
