/**
 * Asis Command React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchCommandLogs,
    createCommandLog,
    fetchEmailSettings,
    findPersonByRut,
    executeVacation,
    executeLicense,
    executePermission,
    executeAuthorization,
    executeDayChange,
    executeNoMark,
    executeNoCredential,
} from './api/asisCommandApi';
import { CommandLogInsert, ParsedCommand, ResolvedPerson, CommandPreview, INTENT_TABLES, INTENT_LABELS } from './types';
import { parseCommand, validateCommand } from './parser/parseCommand';

// Query keys
const commandKeys = {
    logs: (userId?: string) => ['asisCommand', 'logs', userId],
    emailSettings: () => ['asisCommand', 'emailSettings'],
    person: (rut: string) => ['asisCommand', 'person', rut],
};

/**
 * Hook to fetch command history
 */
export const useCommandLogs = (executedBy?: string) => {
    return useQuery({
        queryKey: commandKeys.logs(executedBy),
        queryFn: () => fetchCommandLogs(20, executedBy),
        staleTime: 30000,
    });
};

/**
 * Hook to fetch email settings
 */
export const useEmailSettings = () => {
    return useQuery({
        queryKey: commandKeys.emailSettings(),
        queryFn: fetchEmailSettings,
    });
};

/**
 * Hook to find person by RUT
 */
export const useFindPerson = (rut: string | null) => {
    return useQuery({
        queryKey: commandKeys.person(rut || ''),
        queryFn: () => (rut ? findPersonByRut(rut) : null),
        enabled: Boolean(rut),
    });
};

/**
 * Hook to create command log
 */
export const useCreateCommandLog = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCommandLog,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asisCommand', 'logs'] });
        },
    });
};

/**
 * Hook to execute a command
 */
export const useExecuteCommand = () => {
    const queryClient = useQueryClient();
    const createLog = useCreateCommandLog();

    return useMutation({
        mutationFn: async ({
            parsed,
            person,
            executedBy,
            terminalCode,
        }: {
            parsed: ParsedCommand;
            person: ResolvedPerson;
            executedBy: string;
            terminalCode?: string;
        }) => {
            let result: { success: boolean; error?: string };

            switch (parsed.intent) {
                case 'VACACIONES':
                    result = await executeVacation(
                        person.id,
                        parsed.startDate!,
                        parsed.endDate!,
                        parsed.reason || 'Registrado via Asis Command',
                        executedBy
                    );
                    break;

                case 'LICENCIA':
                    result = await executeLicense(
                        person.id,
                        parsed.startDate!,
                        parsed.endDate!,
                        parsed.reason || 'Registrado via Asis Command',
                        executedBy
                    );
                    break;

                case 'PERMISO':
                    result = await executePermission(
                        person.id,
                        parsed.startDate!,
                        parsed.endDate!,
                        'PERSONAL',
                        parsed.reason || 'Registrado via Asis Command',
                        executedBy
                    );
                    break;

                case 'AUTORIZACION_LLEGADA':
                    result = await executeAuthorization(
                        person.id,
                        person,
                        parsed.startDate!, // Date of incident
                        'LLEGADA',
                        parsed.startTime || '00:00',
                        parsed.reason || 'Llegada Tarde',
                        executedBy
                    );
                    break;

                case 'AUTORIZACION_SALIDA':
                    result = await executeAuthorization(
                        person.id,
                        person,
                        parsed.startDate!,
                        'SALIDA',
                        parsed.startTime || '00:00',
                        parsed.reason || 'Salida Anticipada',
                        executedBy
                    );
                    break;

                case 'CAMBIO_DIA':
                    // Need two dates preferably. If only one, assumption is implicit
                    // If parser found "el viernes por el sábado", we might have:
                    // startDate=Friday, endDate=Saturday? Or parser needs enhancement to separate dayOff/dayOn
                    // For now, assume startDate is the "change" date
                    // If startDate != endDate, use them as the pair
                    const dayOff = parsed.startDate!;
                    const dayOn = (parsed.endDate && parsed.endDate !== parsed.startDate) ? parsed.endDate : parsed.startDate!;

                    result = await executeDayChange(
                        person,
                        dayOff,
                        dayOn,
                        parsed.reason || 'Cambio solicitado',
                        executedBy
                    );
                    break;

                case 'NO_MARCACION':
                    result = await executeNoMark(
                        person,
                        parsed.startDate!,
                        parsed.reason || 'No marcó asistencia',
                        executedBy
                    );
                    break;

                case 'SIN_CREDENCIAL':
                    result = await executeNoCredential(
                        person,
                        parsed.startDate!,
                        parsed.reason || 'Sin credencial física',
                        executedBy
                    );
                    break;

                default:
                    result = { success: false, error: `Intent ${parsed.intent} no implementado aún` };
            }

            // Log the command
            await createLog.mutateAsync({
                command_text: parsed.rawText,
                parsed_intent: parsed.intent,
                payload_json: {
                    person: { id: person.id, rut: person.rut, nombre: person.nombre },
                    startDate: parsed.startDate,
                    endDate: parsed.endDate,
                    reason: parsed.reason,
                },
                executed_by: executedBy,
                terminal_code: terminalCode,
                status: result.success ? 'OK' : 'ERROR',
                error_message: result.error,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            return result;
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['asistencia2026'] });
        },
    });
};

/**
 * Build command preview from parsed command
 */
export function buildPreview(
    parsed: ParsedCommand,
    person: ResolvedPerson | null
): CommandPreview {
    const { isValid, errors } = validateCommand(parsed);
    const warnings: string[] = [];

    // Check if person is desvinculado
    if (person?.status === 'DESVINCULADO') {
        warnings.push('Esta persona está DESVINCULADA del sistema');
    }

    // Build action description
    const intentLabel = INTENT_LABELS[parsed.intent];
    let action = intentLabel;
    if (parsed.startDate && parsed.endDate && parsed.startDate !== parsed.endDate) {
        action += ` del ${parsed.startDate} al ${parsed.endDate}`;
    } else if (parsed.startDate) {
        action += ` el ${parsed.startDate}`;
    }
    if (parsed.startTime) {
        action += ` a las ${parsed.startTime}`;
    }

    return {
        parsedCommand: parsed,
        person,
        personNotFound: parsed.rutNormalized !== null && person === null,
        action,
        targetTable: INTENT_TABLES[parsed.intent],
        emailRecipients: [], // Will be populated from settings
        warnings,
        canExecute: isValid && person !== null && person.status !== 'DESVINCULADO',
    };
}

// Re-export parser for direct use
export { parseCommand, validateCommand };
