import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { FlotaFilters, VehiculoViewModel } from './types';

const MOCK_VEHICULOS: VehiculoViewModel[] = [
  {
    ppu: 'ABCD12',
    modelo: 'Camión 3/4',
    estado: 'operativo',
    odometro: 123400,
    proximaMantencion: '2024-01-15',
    terminal: 'EL_ROBLE',
  },
  {
    ppu: 'EFGH34',
    modelo: 'Furgón',
    estado: 'en_taller',
    odometro: 88400,
    proximaMantencion: '2024-02-01',
    terminal: 'LA_REINA',
  },
  {
    ppu: 'IJKL56',
    modelo: 'Tracto',
    estado: 'fuera_servicio',
    odometro: 230000,
    proximaMantencion: '2024-01-30',
    terminal: 'EL_SALTO',
  },
];

export const flotaAdapter = createMockListAdapter<VehiculoViewModel, FlotaFilters>(
  MOCK_VEHICULOS,
  (row, filters) => {
    const matchEstado = filters?.estado && filters.estado !== 'todos' ? row.estado === filters.estado : true;
    return matchEstado;
  },
);
