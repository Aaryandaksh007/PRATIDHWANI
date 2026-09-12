// ============================================
// RESOURCE BOARD
// Grid of resources with status states
// ============================================

import { el } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';
import { ResourceCard } from '../components/ResourceCard.js';
import { RESOURCES } from '../demo/seedData.js';

export function ResourceBoard() {
  const state = projectState();

  // Merge seed resources with projected state
  const resources = RESOURCES.map(r => {
    const projected = state.resources[r.id];
    return projected ? { ...r, ...projected } : r;
  });

  const view = el('div', { className: 'view-enter' },
    el('div', { className: 'view-header' },
      el('div', { className: 'section-title' }, 'RESOURCE MANAGEMENT'),
      el('h1', { className: 'view-title' }, 'Resource Board'),
      el('div', { className: 'view-subtitle' },
        'Current resource commitments and status'
      ),
    ),

    el('div', { className: 'grid-3 stagger' },
      ...resources.map(r => ResourceCard(r)),
    ),
  );

  return view;
}
