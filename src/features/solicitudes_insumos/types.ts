// =============================================
// SOLICITUDES INTELIGENTES DE INSUMOS - TYPES
// =============================================

// Insumo base
export interface Supply {
    id: string;
    name: string;
    unit: string;
    life_days: number | null;
    min_stock: number;
    created_at: string;
}

// Perfil de consumo por ubicacion/periodo
export type LocationType = 'TERMINAL' | 'CABEZAL';
export type ConsumptionPeriod = 'DAY' | 'NIGHT' | 'WEEKEND';

export interface ConsumptionProfile {
    id: string;
    location_type: LocationType;
    location_name: string;
    period: ConsumptionPeriod;
    supply_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
}

export interface ConsumptionProfileWithSupply extends ConsumptionProfile {
    supply?: Supply;
}

// Solicitud de insumos
export type RequestType = 'SEMANA' | 'FIN_SEMANA' | 'EXTRA';
export type RequestStatus = 'PENDIENTE' | 'RETIRADO';

export interface SupplyRequest {
    id: string;
    terminal: string;
    request_type: RequestType;
    status: RequestStatus;
    receipt_path: string | null;
    requested_at: string;
    retrieved_at: string | null;
    created_by: string;
    consumption_snapshot: Record<string, number> | null;
    created_at: string;
    updated_at: string;
}

// Item de solicitud
export interface SupplyRequestItem {
    id: string;
    request_id: string;
    supply_id: string;
    quantity: number;
    is_extra: boolean;
}

export interface SupplyRequestItemWithSupply extends SupplyRequestItem {
    supply?: Supply;
}

// Solicitud con items expandidos
export interface SupplyRequestWithItems extends SupplyRequest {
    items: SupplyRequestItemWithSupply[];
}

// Entrega a personal
export interface SupplyDelivery {
    id: string;
    supply_id: string;
    staff_rut: string;
    staff_name: string;
    quantity: number;
    delivered_at: string;
    next_delivery_at: string | null;
    notes: string | null;
    created_by: string;
    created_at: string;
}

export interface SupplyDeliveryWithSupply extends SupplyDelivery {
    supply?: Supply;
}

// Configuracion de correos
export type EmailTrigger = 'MONDAY' | 'FRIDAY' | 'MANUAL';

export interface SupplyEmailSettings {
    id: string;
    trigger: EmailTrigger;
    recipients: string;
    subject: string;
    body: string;
    enabled: boolean;
    updated_at: string;
}

// Form values
export interface SupplyFormValues {
    name: string;
    unit: string;
    life_days: number | null;
    min_stock: number;
}

export interface RequestFormValues {
    terminal: string;
    request_type: RequestType;
    items: { supply_id: string; quantity: number; is_extra: boolean }[];
}

export interface DeliveryFormValues {
    supply_id: string;
    staff_rut: string;
    staff_name: string;
    quantity: number;
    notes?: string;
}

// Dashboard types
export interface SupplyStock {
    supply: Supply;
    currentStock: number;
    isLow: boolean;
}

export interface RequestStats {
    pending: number;
    retrieved: number;
    total: number;
}

// Ubicaciones del sistema
export const LOCATIONS = {
    TERMINAL: ['El Roble'] as const,
    CABEZAL: ['El Descanso', 'Aeropuerto', 'Intermodal La Cisterna'] as const,
};

export type TerminalLocation = typeof LOCATIONS.TERMINAL[number];
export type CabezalLocation = typeof LOCATIONS.CABEZAL[number];
