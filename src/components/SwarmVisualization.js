// ============================================
// SWARM VISUALIZATION
// Animated convergence of independent observations
// ============================================

import { el } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';

export function SwarmVisualization(incidentId) {
  const state = projectState();
  const corroboration = state.corroborations[incidentId];
  const incident = state.incidents[incidentId];

  if (!incident) {
    return el('div', { className: 'empty-state' },
      el('div', { className: 'empty-state-icon' }, '◎'),
      el('div', {}, 'No incident data for swarm visualization.'),
    );
  }

  const nodeIds = corroboration ? corroboration.nodeIds : [];
  const isCorroborated = corroboration && corroboration.status === 'CORROBORATED';

  const container = el('div', { className: 'swarm-view' },
    // Title
    el('div', { className: 'swarm-title' },
      el('div', { className: 'section-title' }, 'SWARM SIGNAL ANALYSIS'),
      el('h2', { className: 'view-title' },
        isCorroborated ? 'SWARM SIGNAL DETECTED' : 'AWAITING OBSERVATIONS'
      ),
    ),

    // Visualization area
    el('div', { className: 'swarm-container' },
      // Radiating rings
      isCorroborated ? el('div', { className: 'swarm-ring radiate-ring' }) : null,
      isCorroborated ? el('div', { className: 'swarm-ring swarm-ring-2 radiate-ring', style: { animationDelay: '0.5s' } }) : null,

      // Center incident
      el('div', { className: `swarm-center ${isCorroborated ? 'swarm-pulse' : ''}` },
        el('div', { className: 'swarm-center-id mono' }, incidentId || 'INC-???'),
        el('div', { className: 'swarm-center-label' }, incident.type || 'INCIDENT'),
      ),

      // Node A
      nodeIds.includes('NODE-A') || nodeIds.length === 0 ?
        el('div', { className: `swarm-node swarm-node-pos-a ${isCorroborated ? 'swarm-node-a' : ''}` },
          el('div', { className: 'swarm-node-label' }, 'NODE-A'),
        ) : null,

      // Node B
      nodeIds.includes('NODE-B') || nodeIds.length === 0 ?
        el('div', { className: `swarm-node swarm-node-pos-b ${isCorroborated ? 'swarm-node-b' : ''}` },
          el('div', { className: 'swarm-node-label' }, 'NODE-B'),
        ) : null,

      // Node C
      nodeIds.includes('NODE-C') || nodeIds.length === 0 ?
        el('div', { className: `swarm-node swarm-node-pos-c ${isCorroborated ? 'swarm-node-c' : ''}` },
          el('div', { className: 'swarm-node-label' }, 'NODE-C'),
        ) : null,
    ),

    // Status
    isCorroborated ? el('div', { className: 'swarm-status fade-in-up' },
      el('div', { className: 'swarm-status-title' }, '✓ CORROBORATED'),
      el('div', { className: 'swarm-status-count' },
        `${nodeIds.length} INDEPENDENT OBSERVATIONS`
      ),
      el('div', { style: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)', maxWidth: '400px', lineHeight: 'var(--leading-relaxed)' } },
        'Independent observations corroborate a pattern. This does not automatically prove an outbreak or truth — it means multiple disconnected nodes independently reported related evidence.'
      ),
    ) : null,
  );

  return container;
}
