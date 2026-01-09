import { describe, it, expect } from 'vitest';
import { TaskStateMachine, LeadStateMachine, ExpenseStateMachine, InvoiceStateMachine } from '../src/lib/state-machine';

describe('StateManager - Task States', () => {
    describe('canTransition', () => {
        it('should allow PENDING → IN_PROGRESS', () => {
            expect(TaskStateMachine.canTransition('PENDING', 'IN_PROGRESS')).toBe(true);
        });

        it('should allow IN_PROGRESS → COMPLETED', () => {
            expect(TaskStateMachine.canTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
        });

        it('should NOT allow PENDING → COMPLETED (must go through IN_PROGRESS)', () => {
            expect(TaskStateMachine.canTransition('PENDING', 'COMPLETED')).toBe(false);
        });

        it('should allow transitioning to CANCELLED from PENDING and IN_PROGRESS', () => {
            expect(TaskStateMachine.canTransition('PENDING', 'CANCELLED')).toBe(true);
            expect(TaskStateMachine.canTransition('IN_PROGRESS', 'CANCELLED')).toBe(true);
        });

        it('should NOT allow transitioning from COMPLETED', () => {
            expect(TaskStateMachine.canTransition('COMPLETED', 'PENDING')).toBe(false);
            expect(TaskStateMachine.canTransition('COMPLETED', 'IN_PROGRESS')).toBe(false);
        });
    });

    describe('transition', () => {
        it('should succeed for valid transitions', () => {
            expect(() => {
                TaskStateMachine.transition('PENDING', 'IN_PROGRESS');
            }).not.toThrow();
        });

        it('should throw error for invalid transitions', () => {
            expect(() => {
                TaskStateMachine.transition('PENDING', 'COMPLETED');
            }).toThrow('Transición inválida');
        });
    });

    describe('getValidTransitions', () => {
        it('should return correct next states for PENDING', () => {
            const nextStates = TaskStateMachine.getValidTransitions('PENDING');
            expect(nextStates).toContain('IN_PROGRESS');
            expect(nextStates).toContain('CANCELLED');
            expect(nextStates).not.toContain('COMPLETED');
        });

        it('should return empty array for COMPLETED (terminal state)', () => {
            const nextStates = TaskStateMachine.getValidTransitions('COMPLETED');
            expect(nextStates).toEqual([]);
        });

        it('should return correct next states for IN_PROGRESS', () => {
            const nextStates = TaskStateMachine.getValidTransitions('IN_PROGRESS');
            expect(nextStates).toContain('COMPLETED');
            expect(nextStates).toContain('PENDING');
            expect(nextStates).toContain('CANCELLED');
        });
    });
});

describe('StateManager - Lead States', () => {
    describe('Lead Pipeline Flow', () => {
        it('should allow NEW → QUALIFIED', () => {
            expect(LeadStateMachine.canTransition('NEW', 'QUALIFIED')).toBe(true);
        });

        it('should allow QUALIFIED → PROPOSAL', () => {
            expect(LeadStateMachine.canTransition('QUALIFIED', 'PROPOSAL')).toBe(true);
        });

        it('should allow PROPOSAL → NEGOTIATION', () => {
            expect(LeadStateMachine.canTransition('PROPOSAL', 'NEGOTIATION')).toBe(true);
        });

        it('should allow NEGOTIATION → CLOSED_WON', () => {
            expect(LeadStateMachine.canTransition('NEGOTIATION', 'CLOSED_WON')).toBe(true);
        });

        it('should allow transitioning to CLOSED_LOST from any state', () => {
            expect(LeadStateMachine.canTransition('NEW', 'CLOSED_LOST')).toBe(true);
            expect(LeadStateMachine.canTransition('QUALIFIED', 'CLOSED_LOST')).toBe(true);
            expect(LeadStateMachine.canTransition('PROPOSAL', 'CLOSED_LOST')).toBe(true);
            expect(LeadStateMachine.canTransition('NEGOTIATION', 'CLOSED_LOST')).toBe(true);
        });

        it('should NOT allow backwards progression in pipeline', () => {
            expect(LeadStateMachine.canTransition('PROPOSAL', 'NEW')).toBe(false);
            expect(LeadStateMachine.canTransition('NEGOTIATION', 'QUALIFIED')).toBe(false);
        });

        it('should NOT allow transitions from CLOSED_WON (terminal)', () => {
            expect(LeadStateMachine.canTransition('CLOSED_WON', 'NEGOTIATION')).toBe(false);
        });
    });
});

describe('StateManager - Expense States', () => {
    describe('Expense Approval Flow', () => {
        it('should allow PENDING → APPROVED', () => {
            expect(ExpenseStateMachine.canTransition('PENDING', 'APPROVED')).toBe(true);
        });

        it('should allow PENDING → REJECTED', () => {
            expect(ExpenseStateMachine.canTransition('PENDING', 'REJECTED')).toBe(true);
        });

        it('should allow APPROVED → PAID', () => {
            expect(ExpenseStateMachine.canTransition('APPROVED', 'PAID')).toBe(true);
        });

        it('should allow APPROVED → PENDING (can revert if error)', () => {
            expect(ExpenseStateMachine.canTransition('APPROVED', 'PENDING')).toBe(true);
        });

        it('should NOT allow REJECTED → APPROVED', () => {
            expect(ExpenseStateMachine.canTransition('REJECTED', 'APPROVED')).toBe(false);
        });

        it('should NOT allow PENDING → PAID (must be approved first)', () => {
            expect(ExpenseStateMachine.canTransition('PENDING', 'PAID')).toBe(false);
        });
    });
});

describe('StateManager - Invoice States', () => {
    describe('Invoice Lifecycle', () => {
        it('should allow DRAFT → SENT', () => {
            expect(InvoiceStateMachine.canTransition('DRAFT', 'SENT')).toBe(true);
        });

        it('should allow SENT → PAID', () => {
            expect(InvoiceStateMachine.canTransition('SENT', 'PAID')).toBe(true);
        });

        it('should allow SENT → OVERDUE', () => {
            expect(InvoiceStateMachine.canTransition('SENT', 'OVERDUE')).toBe(true);
        });

        it('should allow OVERDUE → PAID', () => {
            expect(InvoiceStateMachine.canTransition('OVERDUE', 'PAID')).toBe(true);
        });

        it('should allow CANCELLED from DRAFT or SENT or OVERDUE', () => {
            expect(InvoiceStateMachine.canTransition('DRAFT', 'CANCELLED')).toBe(true);
            expect(InvoiceStateMachine.canTransition('SENT', 'CANCELLED')).toBe(true);
            expect(InvoiceStateMachine.canTransition('OVERDUE', 'CANCELLED')).toBe(true);
        });

        it('should allow CANCELLED → DRAFT (can recreate)', () => {
            expect(InvoiceStateMachine.canTransition('CANCELLED', 'DRAFT')).toBe(true);
        });

        it('should NOT allow PAID → any other state (terminal)', () => {
            expect(InvoiceStateMachine.canTransition('PAID', 'SENT')).toBe(false);
            expect(InvoiceStateMachine.canTransition('PAID', 'OVERDUE')).toBe(false);
        });
    });
});
