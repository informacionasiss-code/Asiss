/**
 * Asis Command Index
 * Public exports for the command palette feature
 */

export { AsisCommandFab } from './components/AsisCommandFab';
export { AsisCommandDrawer } from './components/AsisCommandDrawer';

// Types
export type {
    CommandIntent,
    ParsedCommand,
    CommandPreview,
    ResolvedPerson,
    CommandLog,
    QuickSuggestion,
} from './types';

// Parser
export { parseCommand, validateCommand } from './parser/parseCommand';
export { extractRut, normalizeRut, validateRut, formatRut } from './parser/extractRut';
export { extractDate, extractDateRange, extractTime, extractTimeRange } from './parser/extractDates';
export { extractDuration, calculateEndDate, formatDuration } from './parser/extractDuration';
export { extractIntent, getIntentDescription } from './parser/extractIntent';

// Hooks
export {
    useCommandLogs,
    useFindPerson,
    useExecuteCommand,
    buildPreview,
} from './hooks';
