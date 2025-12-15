import { createMockListAdapter } from '../../mock/createMockListAdapter';
import { InformativoFilters, InformativoViewModel } from './types';

const MOCK_INFORMATIVOS: InformativoViewModel[] = [
  {
    id: 'i-1',
    titulo: 'Actualización de protocolos',
    fecha: '2023-12-02',
    enviadoPor: 'Equipo Seguridad',
    alcance: 'todos',
    terminal: 'EL_ROBLE',
  },
  {
    id: 'i-2',
    titulo: 'Corte programado',
    fecha: '2023-12-03',
    enviadoPor: 'Operaciones',
    alcance: 'terminal',
    terminal: 'LA_REINA',
  },
  {
    id: 'i-3',
    titulo: 'Campaña de seguridad',
    fecha: '2023-12-01',
    enviadoPor: 'Prevención',
    alcance: 'segmentado',
    terminal: 'EL_SALTO',
  },
];

export const informativosAdapter = createMockListAdapter<InformativoViewModel, InformativoFilters>(
  MOCK_INFORMATIVOS,
  (row, filters) => {
    const matchAlcance = filters?.alcance && filters.alcance !== 'todos' ? row.alcance === filters.alcance : true;
    return matchAlcance;
  },
);
