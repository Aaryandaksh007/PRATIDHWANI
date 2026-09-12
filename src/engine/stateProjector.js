// ============================================
// STATE PROJECTOR
// Derives current state by replaying events.
// Never mutates events — purely functional projection.
// ============================================

import { getEventLog, EventTypes } from './eventStore.js';

/**
 * Project the current state from the event log.
 * This is called on every render to ensure consistency.
 * @returns {Object} The full derived state
 */
export function projectState() {
  const events = getEventLog();

  const state = {
    incidents: {},       // incidentId -> { id, severity, location, type, nodeId, evidenceIds[], ... }
    evidence: {},        // eventId -> evidence payload
    proposals: {},       // proposalId -> { id, resourceId, destination, nodeId, incidentId, status, ... }
    conflicts: {},       // conflictId -> { id, proposalIds[], resourceId, status, resolutionId }
    resolutions: {},     // resolutionId -> { id, resolvedProposalIds[], decision, reason, ... }
    resources: {},       // resourceId -> { id, name, status, committedTo, ... }
    corroborations: {},  // incidentId -> { nodeIds[], count, status }
    nodes: {},           // nodeId -> { id, status, eventCount }
    reopenedReviews: {}, // resolutionId -> { newProposalId, previousResolutionId, ... }
  };

  for (const event of events) {
    applyEvent(state, event);
  }

  return state;
}

function applyEvent(state, event) {
  const { type, nodeId, payload, id, incidentId } = event;

  // Track node activity
  if (nodeId && nodeId !== 'SYSTEM') {
    if (!state.nodes[nodeId]) {
      state.nodes[nodeId] = { id: nodeId, status: 'OFFLINE', eventCount: 0 };
    }
    state.nodes[nodeId].eventCount++;
  }

  switch (type) {
    case EventTypes.INCIDENT_CREATED: {
      state.incidents[payload.incidentId] = {
        id: payload.incidentId,
        type: payload.incidentType,
        severity: payload.severity,
        location: payload.location,
        affectedCount: payload.affectedCount,
        description: payload.description,
        reportedBy: nodeId,
        createdAt: event.wallTime,
        logicalTime: event.logicalTime,
        evidenceIds: [id],
        proposalIds: [],
        conflictIds: [],
        resolutionIds: [],
        status: 'ACTIVE',
      };
      state.evidence[id] = { ...payload, eventId: id, nodeId, wallTime: event.wallTime };
      break;
    }

    case EventTypes.EVIDENCE_ADDED: {
      state.evidence[id] = { ...payload, eventId: id, nodeId, wallTime: event.wallTime };
      if (incidentId && state.incidents[incidentId]) {
        state.incidents[incidentId].evidenceIds.push(id);
        // Update counts if newer info
        if (payload.affectedCount) {
          state.incidents[incidentId].affectedCount = payload.affectedCount;
        }
        if (payload.severity) {
          state.incidents[incidentId].severity = payload.severity;
        }
      }
      break;
    }

    case EventTypes.PROPOSAL_CREATED: {
      const proposalId = payload.proposalId;
      state.proposals[proposalId] = {
        id: proposalId,
        resourceId: payload.resourceId,
        resourceName: payload.resourceName,
        destination: payload.destination,
        nodeId,
        incidentId: incidentId || payload.incidentId,
        status: 'ACTIVE',
        createdAt: event.wallTime,
        logicalTime: event.logicalTime,
        eventId: id,
      };

      // Track on incident
      const propIncId = incidentId || payload.incidentId;
      if (propIncId && state.incidents[propIncId]) {
        state.incidents[propIncId].proposalIds.push(proposalId);
      }

      // Update resource state
      const resId = payload.resourceId;
      if (!state.resources[resId]) {
        state.resources[resId] = {
          id: resId,
          name: payload.resourceName || resId,
          status: 'AVAILABLE',
          proposals: [],
        };
      }
      state.resources[resId].proposals.push(proposalId);
      state.resources[resId].status = 'COMMITTED';
      state.resources[resId].committedTo = payload.destination;
      break;
    }

    case EventTypes.CONFLICT_DETECTED: {
      const conflictId = payload.conflictId;
      state.conflicts[conflictId] = {
        id: conflictId,
        proposalIds: payload.proposalIds,
        resourceId: payload.resourceId,
        resourceName: payload.resourceName,
        status: 'AWAITING_RESOLUTION',
        detectedAt: event.wallTime,
        resolutionId: null,
      };

      // Update resource status
      if (state.resources[payload.resourceId]) {
        state.resources[payload.resourceId].status = 'CONFLICTED';
      }

      // Update proposal statuses
      for (const pid of payload.proposalIds) {
        if (state.proposals[pid]) {
          state.proposals[pid].status = 'CONFLICTED';
        }
      }

      // Track on incident
      if (incidentId && state.incidents[incidentId]) {
        state.incidents[incidentId].conflictIds.push(conflictId);
      }
      break;
    }

    case EventTypes.RESOLUTION_CREATED: {
      const resolutionId = payload.resolutionId;
      state.resolutions[resolutionId] = {
        id: resolutionId,
        resolvedProposalIds: payload.resolvedProposalIds,
        evidenceConsidered: payload.evidenceConsidered,
        decision: payload.decision,
        decidedProposalId: payload.decidedProposalId,
        reason: payload.reason,
        decisionMaker: payload.decisionMaker,
        createdAt: event.wallTime,
        logicalTime: event.logicalTime,
        status: 'ACTIVE',
      };

      // Update conflict status
      const relConflict = Object.values(state.conflicts).find(c =>
        c.proposalIds.some(pid => payload.resolvedProposalIds.includes(pid))
      );
      if (relConflict) {
        relConflict.status = 'RESOLVED';
        relConflict.resolutionId = resolutionId;
      }

      // Update resource status
      for (const pid of payload.resolvedProposalIds) {
        const proposal = state.proposals[pid];
        if (proposal) {
          if (pid === payload.decidedProposalId) {
            proposal.status = 'ACCEPTED';
          } else {
            proposal.status = 'REJECTED';
          }
          // Update resource
          if (state.resources[proposal.resourceId]) {
            state.resources[proposal.resourceId].status = 'RESOLVED';
            state.resources[proposal.resourceId].committedTo = state.proposals[payload.decidedProposalId]?.destination;
          }
        }
      }

      // Track on incident
      if (incidentId && state.incidents[incidentId]) {
        state.incidents[incidentId].resolutionIds.push(resolutionId);
      }
      break;
    }

    case EventTypes.LATE_PROPOSAL_RECEIVED: {
      const proposalId = payload.proposalId;
      state.proposals[proposalId] = {
        id: proposalId,
        resourceId: payload.resourceId,
        resourceName: payload.resourceName,
        destination: payload.destination,
        nodeId,
        incidentId: incidentId || payload.incidentId,
        status: 'LATE',
        createdAt: event.wallTime,
        logicalTime: event.logicalTime,
        eventId: id,
        isLate: true,
      };

      if (state.resources[payload.resourceId]) {
        state.resources[payload.resourceId].proposals.push(proposalId);
      }
      break;
    }

    case EventTypes.REVIEW_REOPENED: {
      const resolutionId = payload.previousResolutionId;
      state.reopenedReviews[resolutionId] = {
        previousResolutionId: resolutionId,
        newProposalId: payload.newProposalId,
        reason: payload.reason,
        reopenedAt: event.wallTime,
        previousDecision: payload.previousDecision,
        newProposedDestination: payload.newProposedDestination,
        resourceId: payload.resourceId,
        resourceName: payload.resourceName,
      };

      // Mark previous resolution as superseded
      if (state.resolutions[resolutionId]) {
        state.resolutions[resolutionId].status = 'SUPERSEDED';
      }

      // Mark resource as under review
      if (payload.resourceId && state.resources[payload.resourceId]) {
        state.resources[payload.resourceId].status = 'UNDER_REVIEW';
      }

      // Update related conflict
      const relConflict2 = Object.values(state.conflicts).find(c =>
        c.resolutionId === resolutionId
      );
      if (relConflict2) {
        relConflict2.status = 'REOPENED';
      }
      break;
    }

    case EventTypes.NODE_RECONNECTED: {
      if (state.nodes[nodeId]) {
        state.nodes[nodeId].status = 'ONLINE';
      }
      break;
    }

    case EventTypes.CORROBORATION_DETECTED: {
      const incId = payload.incidentId;
      state.corroborations[incId] = {
        incidentId: incId,
        nodeIds: payload.nodeIds,
        count: payload.count,
        status: 'CORROBORATED',
        detectedAt: event.wallTime,
      };
      if (state.incidents[incId]) {
        state.incidents[incId].status = 'CORROBORATED';
      }
      break;
    }

    default:
      break;
  }
}

/**
 * Get summary counts for the command center
 */
export function getStateSummary() {
  const state = projectState();
  const activeConflicts = Object.values(state.conflicts).filter(c => c.status === 'AWAITING_RESOLUTION').length;
  const reopenedReviews = Object.keys(state.reopenedReviews).length;
  const offlineNodes = Object.values(state.nodes).filter(n => n.status === 'OFFLINE').length;
  const onlineNodes = Object.values(state.nodes).filter(n => n.status === 'ONLINE').length;
  const totalIncidents = Object.keys(state.incidents).length;
  const corroborated = Object.keys(state.corroborations).length;
  const pendingResolutions = activeConflicts;
  const resolvedConflicts = Object.values(state.conflicts).filter(c => c.status === 'RESOLVED').length;

  return {
    activeConflicts,
    reopenedReviews,
    offlineNodes,
    onlineNodes,
    totalIncidents,
    corroborated,
    pendingResolutions,
    resolvedConflicts,
    totalEvents: Object.keys(state.evidence).length,
    totalProposals: Object.keys(state.proposals).length,
  };
}
