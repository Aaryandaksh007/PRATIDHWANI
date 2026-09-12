// ============================================
// NODE MANAGER
// Manages per-node local state and merge operations.
// Each node has its own event buffer while offline.
// ============================================

import { appendEvent, EventTypes } from './eventStore.js';

/**
 * Node definitions
 */
const NODE_DEFS = {
  'NODE-A': { id: 'NODE-A', name: 'Field Station Alpha', location: 'Nainital', operator: 'RESP-01' },
  'NODE-B': { id: 'NODE-B', name: 'Field Station Bravo', location: 'Almora', operator: 'RESP-02' },
  'NODE-C': { id: 'NODE-C', name: 'Field Station Charlie', location: 'Bhimtal', operator: 'RESP-03' },
};

/**
 * Per-node local buffers (events created while offline)
 * In production, these would be on separate devices.
 * For the prototype, we simulate them in-memory.
 */
let nodeBuffers = {
  'NODE-A': [],
  'NODE-B': [],
  'NODE-C': [],
};

/**
 * Node online/offline status
 */
let nodeStatus = {
  'NODE-A': 'OFFLINE',
  'NODE-B': 'OFFLINE',
  'NODE-C': 'OFFLINE',
};

/**
 * Get node definition
 */
export function getNodeDef(nodeId) {
  return NODE_DEFS[nodeId] || { id: nodeId, name: nodeId };
}

/**
 * Get all node definitions
 */
export function getAllNodes() {
  return Object.values(NODE_DEFS).map(n => ({
    ...n,
    status: nodeStatus[n.id] || 'OFFLINE',
    bufferSize: (nodeBuffers[n.id] || []).length,
  }));
}

/**
 * Get a node's status
 */
export function getNodeStatus(nodeId) {
  return nodeStatus[nodeId] || 'OFFLINE';
}

/**
 * Set node status
 */
export function setNodeStatus(nodeId, status) {
  nodeStatus[nodeId] = status;
}

/**
 * Get events in a node's local buffer (not yet merged)
 */
export function getNodeBuffer(nodeId) {
  return nodeBuffers[nodeId] || [];
}

/**
 * Add an event to a node's local buffer (offline operation)
 * This simulates creating events on disconnected devices.
 * The event is NOT in the global store yet.
 */
export function addToNodeBuffer(nodeId, eventData) {
  if (!nodeBuffers[nodeId]) nodeBuffers[nodeId] = [];
  nodeBuffers[nodeId].push(eventData);
}

/**
 * Reconnect a node: merge its local buffer into the global event store.
 * This is where the magic happens — offline events become visible to the system.
 *
 * @param {string} nodeId
 * @returns {Array<Object>} The merged events
 */
export function reconnectNode(nodeId) {
  setNodeStatus(nodeId, 'ONLINE');

  // Emit reconnection event
  appendEvent(EventTypes.NODE_RECONNECTED, nodeId, {
    nodeId,
    message: `${nodeId} reconnected. Exchanging evidence.`,
  });

  // Merge local buffer into global store
  const buffer = nodeBuffers[nodeId] || [];
  const mergedEvents = [];

  for (const eventData of buffer) {
    const event = appendEvent(
      eventData.type,
      eventData.nodeId || nodeId,
      eventData.payload,
      eventData.options || {}
    );
    mergedEvents.push(event);
  }

  // Clear the buffer
  nodeBuffers[nodeId] = [];

  return mergedEvents;
}

/**
 * Reconnect all offline nodes
 */
export function reconnectAllNodes() {
  const results = {};
  for (const nodeId of Object.keys(NODE_DEFS)) {
    if (nodeStatus[nodeId] === 'OFFLINE') {
      results[nodeId] = reconnectNode(nodeId);
    }
  }
  return results;
}

/**
 * Reset all node state (for demo reset)
 */
export function resetNodes() {
  nodeBuffers = {
    'NODE-A': [],
    'NODE-B': [],
    'NODE-C': [],
  };
  nodeStatus = {
    'NODE-A': 'OFFLINE',
    'NODE-B': 'OFFLINE',
    'NODE-C': 'OFFLINE',
  };
}
