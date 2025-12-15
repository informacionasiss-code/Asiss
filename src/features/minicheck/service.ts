import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { MiniCheckFilters, MiniCheckTipo, MiniCheckViewModel } from './types';

const MOCK_MINICHECK: MiniCheckViewModel[] = [
  { id: 'm-1', tipo: 'extintor', ppu: 'ABCD12', responsable: 'Ana Pérez', estado: 'ok', fecha: '2023-12-04', terminal: 'EL_ROBLE' },
  { id: 'm-2', tipo: 'tag', ppu: 'EFGH34', responsable: 'Carlos Vega', estado: 'alerta', fecha: '2023-12-03', observaciones: 'Sin tag', terminal: 'LA_REINA' },
  { id: 'm-3', tipo: 'mobileye', ppu: 'IJKL56', responsable: 'Laura Soto', estado: 'ok', fecha: '2023-12-02', terminal: 'EL_SALTO' },
  { id: 'm-4', tipo: 'odometro', ppu: 'MNOP78', responsable: 'Ana Pérez', estado: 'alerta', fecha: '2023-12-01', observaciones: 'Dato faltante', terminal: 'LO_ECHEVERS' },
  { id: 'm-5', tipo: 'publicidad', ppu: 'QRST90', responsable: 'Carlos Vega', estado: 'ok', fecha: '2023-12-01', terminal: 'COLO_COLO' },
];

export const getMiniCheckAdapter = (tipo: MiniCheckTipo) =>
  createMockListAdapter<MiniCheckViewModel, MiniCheckFilters>(
    MOCK_MINICHECK.filter((item) => item.tipo === tipo),
    (row, filters) => {
      const matchEstado = filters?.estado && filters.estado !== 'todas' ? row.estado === filters.estado : true;
      return matchEstado;
    },
  );
