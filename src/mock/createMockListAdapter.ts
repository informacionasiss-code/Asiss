import { ListAdapter, ListQueryParams } from '../shared/types/listing';
import { TerminalCode } from '../shared/types/terminal';
import { filterByTerminalContext } from '../shared/utils/terminal';

export const createMockListAdapter = <T extends { terminal: TerminalCode }, Filters = Record<string, unknown>>(
  dataset: T[],
  predicate?: (row: T, filters?: Filters) => boolean,
): ListAdapter<T, Filters> => ({
  list: async ({ terminalContext, filters, scope }: ListQueryParams<Filters>) => {
    const byTerminal = filterByTerminalContext(dataset, terminalContext);
    if (scope === 'all') {
      return byTerminal;
    }
    return predicate ? byTerminal.filter((row) => predicate(row, filters)) : byTerminal;
  },
});
