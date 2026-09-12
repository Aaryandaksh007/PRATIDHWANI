// ============================================
// FIELD NODE VIEW
// Simulates a field responder's device
// ============================================

import { el } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';
import { getAllNodes, getNodeBuffer, getNodeDef } from '../engine/nodeManager.js';
import { getEventsByNode } from '../engine/eventStore.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { EventTimeline } from '../components/EventTimeline.js';

let selectedNode = 'NODE-A';

export function FieldNode() {
  const state = projectState();
  const nodes = getAllNodes();
  const nodeDef = getNodeDef(selectedNode);
  const nodeState = state.nodes[selectedNode] || { status: 'OFFLINE', eventCount: 0 };
  const nodeEvents = getEventsByNode(selectedNode);
  const buffer = getNodeBuffer(selectedNode);
  const isOffline = nodeState.status === 'OFFLINE' || !state.nodes[selectedNode];

  const view = el('div', { className: 'view-enter' },
    el('div', { className: 'view-header' },
      el('div', { className: 'section-title' }, 'FIELD DEVICE'),
      el('h1', { className: 'view-title' }, `${selectedNode}`),
      el('div', { className: 'view-subtitle' }, nodeDef.name || ''),
    ),

    // Node selector
    el('div', { className: 'field-node-selector' },
      ...nodes.map(n =>
        el('button', {
          className: `field-node-tab ${n.id === selectedNode ? 'active' : ''}`,
          onClick: () => {
            selectedNode = n.id;
            // Re-render
            const container = document.getElementById('view-container');
            container.innerHTML = '';
            container.appendChild(FieldNode());
          },
        },
          n.id,
          n.status === 'OFFLINE' ? ' ◌' : ' ●',
        )
      ),
    ),

    // Status bar
    el('div', { className: 'field-node-status-bar' },
      el('div', { className: 'flex items-center gap-3' },
        isOffline ?
          el('div', { className: 'offline-indicator pulse-offline' },
            el('span', { className: 'offline-dot' }),
            'NO CONNECTIVITY',
          ) :
          el('div', { className: 'offline-indicator', style: { borderColor: 'var(--color-verified-dim)', background: 'var(--color-verified-bg)', color: 'var(--color-verified)' } },
            el('span', { className: 'offline-dot', style: { background: 'var(--color-verified)', animation: 'none' } }),
            'CONNECTED',
          ),
      ),
      el('div', { className: 'flex items-center gap-4' },
        StatusBadge(isOffline ? 'OFFLINE' : 'ONLINE'),
        el('div', { className: 'mono-sm text-tertiary' },
          `${nodeEvents.length} synced · ${buffer.length} pending`
        ),
      ),
    ),

    // Pending events in buffer
    buffer.length > 0 ? el('div', { className: 'command-section' },
      el('div', { className: 'section-title' }, 'LOCAL BUFFER (NOT YET SYNCED)'),
      el('div', { className: 'flex flex-col gap-2' },
        ...buffer.map((evt, i) =>
          el('div', { className: 'card' },
            el('div', { className: 'flex items-center justify-between' },
              el('span', { className: 'mono-sm' }, evt.type.replace(/_/g, ' ')),
              StatusBadge('OFFLINE'),
            ),
            evt.payload.description ?
              el('div', { className: 'mt-2', style: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' } },
                evt.payload.description.substring(0, 100)
              ) : null,
            evt.payload.proposalId ?
              el('div', { className: 'mt-2 mono-sm' },
                `${evt.payload.proposalId}: ${evt.payload.resourceName || ''} → ${evt.payload.destination || ''}`
              ) : null,
          )
        ),
      ),
    ) : null,

    // Synced events
    nodeEvents.length > 0 ? el('div', { className: 'command-section mt-6' },
      el('div', { className: 'section-title' }, 'SYNCED EVENTS'),
      EventTimeline({ events: nodeEvents }),
    ) : null,

    // Empty state
    nodeEvents.length === 0 && buffer.length === 0 ?
      el('div', { className: 'empty-state' },
        el('div', { className: 'empty-state-icon' }, '◌'),
        el('div', { style: { fontSize: 'var(--text-lg)', fontWeight: '600' } }, 'No activity'),
        el('div', { className: 'mt-2 text-secondary' },
          isOffline ? 'Node is offline. Events created locally will be stored in the buffer.' :
                      'Node is connected but has no events yet.'
        ),
      ) : null,
  );

  return view;
}
