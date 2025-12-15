import { TerminalContext } from './terminal';

export type ListScope = 'view' | 'all';

export interface ListQueryParams<Filters = Record<string, unknown>> {
  terminalContext: TerminalContext;
  filters?: Filters;
  scope?: ListScope;
}

export interface ListAdapter<T, Filters = Record<string, unknown>> {
  list: (params: ListQueryParams<Filters>) => Promise<T[]>;
}
