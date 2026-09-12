// ============================================
// RESOLUTION ENGINE
// Handles human resolution of conflicts.
// Implements REOPEN logic: late evidence → review reopened.
// PRATIDHWANI NEVER SILENTLY DESTROYS INFORMATION.
// ============================================

import { appendEvent, EventTypes } from './eventStore.js';
import { projectState } from './stateProjector.js';
import { resId } from '../utils/idGen.js';

/**
 * Create a resolution for conflicting proposals.
 *
 * A resolution must contain:
 * - resolvedProposalIds[] — which proposals this resolves
 * - evidenceConsidered[] — which evidence informed the decision
 * - decision — the chosen destination/action
 * - decidedProposalId — which proposal was selected
 * - reason — human-provided rationale
 * - decisionMaker — who decided
 *
 * @param {Object} params
 * @returns {Object} The resolution event
 */
export function createResolution({
  resolvedProposalIds,
  evidenceConsidered,
  decision,
  decidedProposalId,
  reason,
  decisionMaker,
  incidentId,
}) {
  const resolutionId = resId();

  const event = appendEvent(
    EventTypes.RESOLUTION_CREATED,
    decisionMaker || 'COORDINATOR-01',
    {
      resolutionId,
      resolvedProposalIds,
      evidenceConsidered,
      decision,
      decidedProposalId,
      reason,
      decisionMaker: decisionMaker || 'COORDINATOR-01',
    },
    { incidentId }
  );

  return { resolutionId, event };
}

/**
 * Check if a new proposal is incompatible with an existing resolution.
 * If so, reopen the review.
 *
 * Logic:
 * 1. Find all resolutions for the same resource
 * 2. If the new proposal's destination differs from the resolved decision
 * 3. AND the resolution is currently ACTIVE (not already superseded)
 * 4. THEN reopen review
 *
 * @param {Object} newProposal - The late-arriving proposal
 * @returns {Object|null} The reopen event, or null if no reopen needed
 */
export function checkAndReopenReview(newProposal) {
  const state = projectState();

  // Find active resolutions that involve the same resource
  const activeResolutions = Object.values(state.resolutions).filter(r =>
    r.status === 'ACTIVE'
  );

  for (const resolution of activeResolutions) {
    // Get the decided proposal
    const decidedProposal = state.proposals[resolution.decidedProposalId];
    if (!decidedProposal) continue;

    // Same resource, different destination?
    if (
      decidedProposal.resourceId === newProposal.resourceId &&
      decidedProposal.destination !== newProposal.destination
    ) {
      // REOPEN REVIEW
      const event = appendEvent(
        EventTypes.REVIEW_REOPENED,
        'SYSTEM',
        {
          previousResolutionId: resolution.id,
          newProposalId: newProposal.id,
          resourceId: newProposal.resourceId,
          resourceName: newProposal.resourceName,
          reason: 'New incompatible evidence arrived after the previous resolution.',
          previousDecision: resolution.decision,
          newProposedDestination: newProposal.destination,
        },
        { incidentId: newProposal.incidentId }
      );

      return { event, resolution, newProposal };
    }
  }

  return null;
}

/**
 * Get all resolutions for display
 */
export function getResolutions() {
  const state = projectState();
  return Object.values(state.resolutions);
}

/**
 * Get a specific resolution
 */
export function getResolution(resolutionId) {
  const state = projectState();
  return state.resolutions[resolutionId];
}

/**
 * Get all reopened reviews
 */
export function getReopenedReviews() {
  const state = projectState();
  return Object.values(state.reopenedReviews);
}
