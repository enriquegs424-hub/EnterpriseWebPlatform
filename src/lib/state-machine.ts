/**
 * StateManager - Máquina de Estados Genérica
 * 
 * Define transiciones válidas entre estados para cada entidad
 * Previene transiciones ilegales (ej: PENDING → COMPLETED sin IN_PROGRESS)
 */

// Definición de transiciones válidas por entidad
type StateTransitions = Record<string, string[]>;
type EntityStates = Record<string, StateTransitions>;

const STATE_MACHINES: EntityStates = {
    // Tasks: estados y transiciones permitidas
    Task: {
        PENDING: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "PENDING", "CANCELLED"],
        COMPLETED: [], // Estado final, no puede cambiar
        CANCELLED: ["PENDING"], // Puede reactivarse
    },

    // Leads/CRM: pipeline de ventas
    Lead: {
        NEW: ["QUALIFIED", "CLOSED_LOST"],
        QUALIFIED: ["PROPOSAL", "NEW", "CLOSED_LOST"],
        PROPOSAL: ["NEGOTIATION", "QUALIFIED", "CLOSED_LOST"],
        NEGOTIATION: ["CLOSED_WON", "CLOSED_LOST", "PROPOSAL"],
        CLOSED_WON: [], // Estado final
        CLOSED_LOST: ["NEW"], // Puede reactivarse
    },

    // Expenses: flujo de aprobación
    Expense: {
        PENDING: ["APPROVED", "REJECTED"],
        APPROVED: ["PAID", "PENDING"], // Puede volver a pendiente si hay error
        REJECTED: ["PENDING"], // Puede reenviar
        PAID: [], // Estado final
    },

    // Invoices: ciclo de facturación
    Invoice: {
        DRAFT: ["SENT", "CANCELLED"],
        SENT: ["PAID", "OVERDUE", "CANCELLED"],
        OVERDUE: ["PAID", "CANCELLED"],
        PAID: [], // Estado final
        CANCELLED: ["DRAFT"], // Puede recrearse
    },

    // TimeEntry: flujo de aprobación de horas
    TimeEntry: {
        DRAFT: ["SUBMITTED"],
        SUBMITTED: ["APPROVED", "REJECTED", "DRAFT"],
        APPROVED: [], // Estado final, no editable
        REJECTED: ["DRAFT"], // Vuelve para editar
    },

    // Events: asistencia
    EventAttendee: {
        PENDING: ["ACCEPTED", "DECLINED", "TENTATIVE"],
        ACCEPTED: ["DECLINED", "TENTATIVE"],
        DECLINED: ["ACCEPTED", "TENTATIVE"],
        TENTATIVE: ["ACCEPTED", "DECLINED"],
    },
};

export class StateManager {
    private entityType: string;
    private transitions: StateTransitions;

    constructor(entityType: string) {
        this.entityType = entityType;
        this.transitions = STATE_MACHINES[entityType] || {};

        if (Object.keys(this.transitions).length === 0) {
            console.warn(`[StateManager] No state machine defined for ${entityType}`);
        }
    }

    /**
     * Verificar si una transición es válida
     */
    canTransition(fromState: string, toState: string): boolean {
        const validNextStates = this.transitions[fromState];
        if (!validNextStates) return false;
        return validNextStates.includes(toState);
    }

    /**
     * Obtener estados válidos desde el estado actual
     */
    getValidTransitions(currentState: string): string[] {
        return this.transitions[currentState] || [];
    }

    /**
     * Intentar transición - lanza error si no es válida
     */
    transition(fromState: string, toState: string): string {
        if (fromState === toState) {
            return toState; // No es un cambio real
        }

        if (!this.canTransition(fromState, toState)) {
            const validStates = this.getValidTransitions(fromState);
            throw new Error(
                `Transición inválida para ${this.entityType}: ` +
                `${fromState} → ${toState}. ` +
                `Estados válidos: ${validStates.join(", ") || "ninguno (estado final)"}`
            );
        }

        return toState;
    }

    /**
     * Verificar si un estado es final (sin transiciones salientes)
     */
    isFinalState(state: string): boolean {
        const validStates = this.transitions[state];
        return validStates ? validStates.length === 0 : true;
    }

    /**
     * Obtener todos los estados definidos para esta entidad
     */
    getAllStates(): string[] {
        return Object.keys(this.transitions);
    }
}

// Factory functions para facilitar uso
export const TaskStateMachine = new StateManager("Task");
export const LeadStateMachine = new StateManager("Lead");
export const ExpenseStateMachine = new StateManager("Expense");
export const InvoiceStateMachine = new StateManager("Invoice");
export const TimeEntryStateMachine = new StateManager("TimeEntry");
export const EventAttendeeStateMachine = new StateManager("EventAttendee");

/**
 * Helper para validar transición antes de update en base de datos
 */
export function validateStateTransition(
    entityType: string,
    currentState: string,
    newState: string
): void {
    const sm = new StateManager(entityType);
    sm.transition(currentState, newState);
}

/**
 * Helper para obtener opciones de estado siguiente (para UI)
 */
export function getNextStateOptions(
    entityType: string,
    currentState: string
): { value: string; label: string }[] {
    const sm = new StateManager(entityType);
    const validStates = sm.getValidTransitions(currentState);

    return validStates.map(state => ({
        value: state,
        label: formatStateLabel(state),
    }));
}

// Formatear estado para UI
function formatStateLabel(state: string): string {
    return state
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}
