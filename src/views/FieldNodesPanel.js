// ============================================
// FIELD NODES PANEL — Three-Column Simultaneous View
// Desktop/tablet-first. Shows all three field devices
// side-by-side with their local/offline event logs.
// ============================================

import { el } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';
import { getAllNodes, getNodeBuffer, getNodeDef } from '../engine/nodeManager.js';
import { getEventsByNode, getEventCount } from '../engine/eventStore.js';
import { StatusBadge } from '../components/StatusBadge.js';

export function FieldNodesPanel() {
  const state = projectState();
  const nodes = getAllNodes();
  const totalSynced = getEventCount();

  // Count total pending across all nodes
  const totalPending = nodes.reduce((sum, n) => sum + (n.bufferSize || 0), 0);

  const view = el('div', { className: 'view-enter' },
    // Header
    el('div', { className: 'view-header' },
      el('div', { className: 'section-title' }, 'DISTRIBUTED FIELD DEVICES'),
      el('h1', { className: 'view-title' }, 'Field Nodes'),
      el('div', { className: 'view-subtitle' },
        'Each node operates independently while disconnected. Local events are buffered until reconnection.'
      ),
    ),

    // Transport status strip
    buildTransportStrip(nodes, totalPending, totalSynced),

    // Three-column node grid
    el('div', { className: 'field-nodes-grid' },
      ...nodes.map(n => buildNodeColumn(n, state)),
    ),

    // Architecture diagram
    el('div', { className: 'transport-architecture' },
      el('div', { className: 'transport-arch-label mono-sm' }, 'SYSTEM ARCHITECTURE'),
      el('div', { className: 'transport-arch-flow' },
        el('div', { className: 'transport-arch-nodes' },
          ...nodes.map(n =>
            el('div', { className: `transport-arch-node ${n.status === 'ONLINE' ? 'online' : 'offline'}` },
              n.id,
            )
          ),
        ),
        el('div', { className: 'transport-arch-arrow' }, '↓'),
        el('div', { className: 'transport-arch-step' }, 'LOCAL / OFFLINE EVENT LOGS'),
        el('div', { className: 'transport-arch-arrow' }, '↓'),
        el('div', { className: 'transport-arch-step' }, 'RECONNECT'),
        el('div', { className: 'transport-arch-arrow' }, '↓'),
        el('div', { className: 'transport-arch-step highlight' }, 'PRATIDHWANI ENGINE'),
        el('div', { className: 'transport-arch-arrow' }, '↓'),
        el('div', { className: 'transport-arch-step' }, 'CONFLICT REVIEW'),
      ),
    ),
  );

  return view;
}

function buildTransportStrip(nodes, totalPending, totalSynced) {
  return el('div', { className: 'transport-strip' },
    el('div', { className: 'transport-strip-nodes' },
      ...nodes.map(n => {
        const isOnline = n.status === 'ONLINE';
        return el('div', { className: `transport-node-indicator ${isOnline ? 'online' : 'offline'}` },
          el('span', { className: `transport-node-dot ${isOnline ? 'dot-online' : 'dot-offline'}` }),
          el('span', { className: 'transport-node-id mono-sm' }, n.id),
          el('span', { className: 'transport-node-status' }, isOnline ? 'ONLINE' : 'OFFLINE'),
        );
      }),
    ),
    el('div', { className: 'transport-strip-info' },
      el('div', { className: 'transport-strip-label mono-sm' },
        '⬡ SIMULATED OFFLINE TRANSPORT'
      ),
      el('div', { className: 'transport-strip-counts mono-sm' },
        `LOCAL EVENTS: ${totalPending}  ·  SYNCED: ${totalSynced}`
      ),
    ),
  );
}

function buildNodeColumn(node, state) {
  const buffer = getNodeBuffer(node.id);
  const syncedEvents = getEventsByNode(node.id);
  const isOffline = node.status === 'OFFLINE';
  const nodeDef = getNodeDef(node.id);

  return el('div', { className: `field-node-column ${isOffline ? 'node-offline' : 'node-online'}` },
    // Node header
    el('div', { className: 'field-node-col-header' },
      el('div', { className: 'field-node-col-id mono' }, node.id),
      StatusBadge(node.status),
    ),
    el('div', { className: 'field-node-col-name' }, nodeDef.name),
    el('div', { className: 'field-node-col-location mono-sm' },
      nodeDef.location ? `📍 ${nodeDef.location}` : '',
    ),

    // Connectivity indicator
    el('div', { className: `field-node-connectivity ${isOffline ? 'disconnected' : 'connected'}` },
      el('span', { className: 'connectivity-dot' }),
      isOffline ? 'NO CONNECTIVITY' : 'CONNECTED',
    ),

    // Local buffer
    el('div', { className: 'field-node-col-section' },
      el('div', { className: 'field-node-col-section-title' },
        `LOCAL BUFFER (${buffer.length})`,
      ),
      buffer.length > 0
        ? el('div', { className: 'field-node-buffer-list' },
            ...buffer.map(evt => buildBufferEvent(evt)),
          )
        : el('div', { className: 'field-node-empty' }, 'No pending events'),
    ),

    // Synced events summary
    el('div', { className: 'field-node-col-section' },
      el('div', { className: 'field-node-col-section-title' },
        `SYNCED (${syncedEvents.length})`,
      ),
      syncedEvents.length > 0
        ? el('div', { className: 'field-node-synced-list' },
            ...syncedEvents.slice(-4).map(evt => buildSyncedEvent(evt)),
          )
        : el('div', { className: 'field-node-empty' }, 'No synced events'),
    ),

    // Footer stats
    el('div', { className: 'field-node-col-footer mono-sm' },
      `${syncedEvents.length} synced · ${buffer.length} pending`,
    ),
  );
}

function buildBufferEvent(evt) {
  const typeLabel = evt.type.replace(/_/g, ' ');
  const payload = evt.payload || {};

  return el('div', { className: 'buffer-event-card' },
    el('div', { className: 'buffer-event-type mono-sm' }, typeLabel),
    // Show payload data — this is the key for "not faking it"
    payload.incidentId
      ? el('div', { className: 'buffer-event-data mono-sm' }, payload.incidentId)
      : null,
    payload.description
      ? el('div', { className: 'buffer-event-desc' },
          payload.description.substring(0, 60) + (payload.description.length > 60 ? '…' : ''),
        )
      : null,
    payload.proposalId
      ? el('div', { className: 'buffer-event-proposal' },
          el('span', { className: 'mono-sm' }, payload.proposalId + ': '),
          el('span', { className: 'buffer-event-proposal-detail' },
            `${payload.resourceName || payload.resourceId || ''} → ${payload.destination || ''}`,
          ),
        )
      : null,
    payload.affectedCount
      ? el('div', { className: 'buffer-event-meta mono-sm' },
          `${payload.affectedCount} affected · ${payload.severity || ''}`,
        )
      : null,
  );
}

function buildSyncedEvent(evt) {
  const typeLabel = evt.type.replace(/_/g, ' ');
  return el('div', { className: 'synced-event-item' },
    el('span', { className: 'synced-event-time mono-sm' }, evt.wallTime),
    el('span', { className: 'synced-event-type' }, typeLabel),
  );
}
