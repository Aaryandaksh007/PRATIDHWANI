// ============================================
// CONFLICT ENGINE
// Algorithmic detection of incompatible commitments.
// NOT hardcoded to one scenario — reusable logic.
// ============================================

import { appendEvent, EventTypes, getEventsByType } from './eventStore.js';
import { projectState } from './stateProjector.js';
import { conId } from '../utils/idGen.js';

/**
 * Scan all active proposals for resource conflicts.
 * A conflict exists when:
 *   - proposalA.resourceId == proposalB.resourceId
 *   - proposalA.destination != proposalB.destination
 *   - both proposals are independently valid (ACTIVE status)
 *   - no existing conflict already covers this pair
 *
 * @returns {Array<Object>} Newly detected conflicts
 */
export function detectConflicts() {
  const state = projectState();
  const proposals = Object.values(state.proposals).filter(p =>
    p.status === 'ACTIVE' || p.status === 'COMMITTED'
  );
  const existingConflicts = Object.values(state.conflicts);
  const newConflicts = [];

  // Group proposals by resourceId
  const byResource = {};
  for (const proposal of proposals) {
    if (!byResource[proposal.resourceId]) {
      byResource[proposal.resourceId] = [];
    }
    byResource[proposal.resourceId].push(proposal);
  }

  // Check each resource group for incompatible destinations
  for (const [resourceId, resourceProposals] of Object.entries(byResource)) {
    if (resourceProposals.length < 2) continue;

    // Check all pairs
    for (let i = 0; i < resourceProposals.length; i++) {
      for (let j = i + 1; j < resourceProposals.length; j++) {
        const a = resourceProposals[i];
        const b = resourceProposals[j];

        // Different destinations?
        if (a.destination === b.destination) continue;

        // Already covered by an existing conflict?
        const alreadyCovered = existingConflicts.some(c =>
          c.resourceId === resourceId &&
          c.proposalIds.includes(a.id) &&
          c.proposalIds.includes(b.id)
        );
        if (alreadyCovered) continue;

        // NEW CONFLICT
        const conflictId = conId();
        const conflictEvent = appendEvent(
          EventTypes.CONFLICT_DETECTED,
          'SYSTEM',
          {
            conflictId,
            proposalIds: [a.id, b.id],
            resourceId,
            resourceName: a.resourceName || resourceId,
            proposals: [
              { id: a.id, destination: a.destination, nodeId: a.nodeId },
              { id: b.id, destination: b.destination, nodeId: b.nodeId },
            ],
          },
          { incidentId: a.incidentId || b.incidentId }
        );

        newConflicts.push({
          conflictId,
          event: conflictEvent,
          proposalA: a,
          proposalB: b,
        });
      }
    }
  }

  return newConflicts;
}

/**
 * Check if a specific resource has any active conflicts
 */
export function hasActiveConflict(resourceId) {
  const state = projectState();
  return Object.values(state.conflicts).some(
    c => c.resourceId === resourceId && c.status === 'AWAITING_RESOLUTION'
  );
}

/**
 * Get all conflicts for display
 */
export function getActiveConflicts() {
  const state = projectState();
  return Object.values(state.conflicts).filter(c => c.status === 'AWAITING_RESOLUTION');
}

/**
 * Get all conflicts including resolved and reopened
 */
export function getAllConflicts() {
  const state = projectState();
  return Object.values(state.conflicts);
}
