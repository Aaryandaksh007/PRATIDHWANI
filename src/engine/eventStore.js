// ============================================
// EVENT STORE — Immutable Append-Only Log
// ============================================
// PRATIDHWANI NEVER SILENTLY DESTROYS INFORMATION.
// Every action is an immutable event. State is derived, never mutated.

import { evtId } from '../utils/idGen.js';
import { getLogicalTime, getWallTime, tick } from '../utils/time.js';

/** @type {Array<Object>} The global event log — append only */
let eventLog = [];

/** @type {Set<Function>} Subscribers notified on new events */
const subscribers = new Set();

/**
 * Event types in the system
 */
export const EventTypes = {
  INCIDENT_CREATED:       'INCIDENT_CREATED',
  EVIDENCE_ADDED:         'EVIDENCE_ADDED',
  PROPOSAL_CREATED:       'PROPOSAL_CREATED',
  RESOURCE_COMMITTED:     'RESOURCE_COMMITTED',
  CONFLICT_DETECTED:      'CONFLICT_DETECTED',
  RESOLUTION_CREATED:     'RESOLUTION_CREATED',
  ACKNOWLEDGEMENT_ADDED:  'ACKNOWLEDGEMENT_ADDED',
  LATE_PROPOSAL_RECEIVED: 'LATE_PROPOSAL_RECEIVED',
  REVIEW_REOPENED:        'REVIEW_REOPENED',
  NODE_RECONNECTED:       'NODE_RECONNECTED',
  EVIDENCE_EXCHANGED:     'EVIDENCE_EXCHANGED',
  CORROBORATION_DETECTED: 'CORROBORATION_DETECTED',
};

/**
 * Append a new event to the log.
 * This is the ONLY way to modify the system.
 * @param {string} type - EventTypes value
 * @param {string} nodeId - Source node ID
 * @param {Object} payload - Event-specific data
 * @param {Object} [options] - Optional overrides (id, incidentId, etc.)
 * @returns {Object} The created event
 */
export function appendEvent(type, nodeId, payload = {}, options = {}) {
  const logicalTime = tick();
  const event = {
    id: options.id || evtId(),
    type,
    nodeId,
    logicalTime,
    wallTime: options.wallTime || getWallTime(),
    incidentId: options.incidentId || payload.incidentId || null,
    payload,
    createdAt: Date.now(),
  };

  eventLog.push(Object.freeze(event));
  notifySubscribers(event);
  return event;
}

/**
 * Get the full event log (read-only copy reference)
 */
export function getEventLog() {
  return eventLog;
}

/**
 * Get events filtered by type
 */
export function getEventsByType(type) {
  return eventLog.filter(e => e.type === type);
}

/**
 * Get events for a specific node
 */
export function getEventsByNode(nodeId) {
  return eventLog.filter(e => e.nodeId === nodeId);
}

/**
 * Get events for a specific incident
 */
export function getEventsByIncident(incidentId) {
  return eventLog.filter(e => e.incidentId === incidentId);
}

/**
 * Get a single event by ID
 */
export function getEventById(id) {
  return eventLog.find(e => e.id === id);
}

/**
 * Subscribe to new events
 */
export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Notify all subscribers
 */
function notifySubscribers(event) {
  for (const fn of subscribers) {
    try { fn(event); } catch (e) { console.error('Subscriber error:', e); }
  }
}

/**
 * Reset the entire event log (for demo reset)
 */
export function resetEventLog() {
  eventLog = [];
  // Don't notify — this is a full reset
}

/**
 * Get event count
 */
export function getEventCount() {
  return eventLog.length;
}
