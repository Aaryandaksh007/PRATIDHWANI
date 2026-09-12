// ============================================
// CORROBORATION ENGINE
// Detects independent observations of related events.
// Does NOT claim truth — reports pattern corroboration.
// ============================================

import { appendEvent, EventTypes } from './eventStore.js';
import { projectState } from './stateProjector.js';

/**
 * Check if multiple independent nodes have reported
 * observations that corroborate a related incident.
 *
 * Criteria: same location, similar type, different nodes.
 *
 * @param {string} incidentId - The incident to check corroboration for
 * @returns {Object|null} Corroboration result or null
 */
export function checkCorroboration(incidentId) {
  const state = projectState();
  const incident = state.incidents[incidentId];
  if (!incident) return null;

  // Already corroborated?
  if (state.corroborations[incidentId]) return state.corroborations[incidentId];

  // Find all evidence for this incident from different nodes
  const evidenceByNode = {};
  for (const evtId of incident.evidenceIds) {
    const evidence = state.evidence[evtId];
    if (evidence && evidence.nodeId) {
      evidenceByNode[evidence.nodeId] = evidence;
    }
  }

  const uniqueNodes = Object.keys(evidenceByNode);
  if (uniqueNodes.length < 2) return null;

  return {
    incidentId,
    nodeIds: uniqueNodes,
    count: uniqueNodes.length,
    status: 'CORROBORATED',
  };
}

/**
 * Trigger corroboration detection and emit event.
 * @param {string} incidentId
 * @param {string[]} nodeIds - The nodes that independently observed
 * @returns {Object} The corroboration event
 */
export function triggerCorroboration(incidentId, nodeIds) {
  const event = appendEvent(
    EventTypes.CORROBORATION_DETECTED,
    'SYSTEM',
    {
      incidentId,
      nodeIds,
      count: nodeIds.length,
      message: `${nodeIds.length} independent observations corroborate a pattern.`,
    },
    { incidentId }
  );

  return event;
}
