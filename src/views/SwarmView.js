// ============================================
// SWARM VIEW
// Corroboration visualization
// ============================================

import { el } from '../utils/dom.js';
import { SwarmVisualization } from '../components/SwarmVisualization.js';
import { projectState } from '../engine/stateProjector.js';
import { getDemoIds } from '../demo/demoController.js';

export function SwarmView() {
  const state = projectState();
  const demoIds = getDemoIds();
  const incidentId = demoIds.incidentId || Object.keys(state.incidents)[0];

  const view = el('div', { className: 'view-enter' },
    el('div', { className: 'view-header' },
      el('div', { className: 'section-title' }, 'SIGNAL CORRELATION'),
      el('h1', { className: 'view-title' }, 'Swarm View'),
      el('div', { className: 'view-subtitle' },
        'Visualizing independent observation convergence'
      ),
    ),

    incidentId ?
      SwarmVisualization(incidentId) :
      el('div', { className: 'empty-state' },
        el('div', { className: 'empty-state-icon' }, '◎'),
        el('div', {}, 'No incident data available for swarm analysis.'),
      ),
  );

  return view;
}
