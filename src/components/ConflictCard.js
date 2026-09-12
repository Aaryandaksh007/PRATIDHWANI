// ============================================
// CONFLICT CARD — THE HERO COMPONENT
// Dramatic visualization of resource conflicts
// Now includes ENGINE INSPECTOR showing the
// actual detection rule and input data.
// ============================================

import { el } from '../utils/dom.js';
import { StatusBadge } from './StatusBadge.js';
import { projectState } from '../engine/stateProjector.js';

export function ConflictCard(conflict, options = {}) {
  const state = projectState();
  const proposals = conflict.proposalIds.map(pid => state.proposals[pid]).filter(Boolean);

  if (proposals.length < 2) return el('div', {}, 'Invalid conflict data');

  const [propA, propB] = proposals;
  const isReopened = conflict.status === 'REOPENED';
  const isResolved = conflict.status === 'RESOLVED';

  const card = el('div', {
    className: `conflict-card ${isReopened ? 'reopen-flash' : ''} ${!isResolved ? 'conflict-pulse' : ''}`,
  },
    // Resource header
    el('div', { className: 'conflict-card-resource' },
      el('div', { className: 'conflict-card-resource-name' },
        conflict.resourceName || conflict.resourceId
      ),
      el('div', { className: 'conflict-card-resource-id mono-sm' }, conflict.resourceId),
      el('div', { className: 'mt-2' }, StatusBadge(conflict.status)),
    ),

    // VS visualization
    el('div', { className: 'conflict-vs-container' },
      // Side A
      el('div', { className: 'conflict-side' },
        el('div', { className: 'conflict-side-station' }, propA.nodeId),
        el('div', { className: 'conflict-side-proposal mono' }, propA.id),
        el('div', { className: 'conflict-side-arrow' }, '↓'),
        el('div', { className: 'conflict-side-destination' }, propA.destination),
      ),

      // VS divider
      el('div', { className: 'conflict-vs-divider' },
        el('div', { className: 'conflict-vs-text vs-pulse' }, 'VS'),
      ),

      // Side B
      el('div', { className: 'conflict-side' },
        el('div', { className: 'conflict-side-station' }, propB.nodeId),
        el('div', { className: 'conflict-side-proposal mono' }, propB.id),
        el('div', { className: 'conflict-side-arrow' }, '↓'),
        el('div', { className: 'conflict-side-destination' }, propB.destination),
      ),
    ),

    // ENGINE INSPECTOR — shows the actual algorithmic logic
    el('div', { className: 'engine-inspector' },
      el('div', { className: 'engine-inspector-header' },
        el('span', { className: 'engine-inspector-icon' }, '⚙'),
        el('span', {}, 'ENGINE INSPECTOR'),
      ),
      el('div', { className: 'engine-inspector-body' },
        // Detection rule
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'DETECTION RULE'),
          el('pre', { className: 'engine-inspector-code' },
            `proposalA.resourceId == proposalB.resourceId\nproposalA.destination != proposalB.destination`,
          ),
        ),
        // Input data
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'INPUT DATA'),
          el('pre', { className: 'engine-inspector-code' },
            `A: { resource: "${propA.resourceId}", dest: "${propA.destination}" }\nB: { resource: "${propB.resourceId}", dest: "${propB.destination}" }`,
          ),
        ),
        // Evaluation
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'EVALUATION'),
          el('div', { className: 'engine-inspector-eval' },
            el('div', { className: 'engine-eval-row' },
              el('span', { className: 'engine-eval-check mono-sm' }, '"' + propA.resourceId + '" == "' + propB.resourceId + '"'),
              el('span', { className: 'engine-eval-result pass' }, '✓ TRUE'),
            ),
            el('div', { className: 'engine-eval-row' },
              el('span', { className: 'engine-eval-check mono-sm' }, '"' + propA.destination + '" != "' + propB.destination + '"'),
              el('span', { className: 'engine-eval-result pass' }, '✓ TRUE'),
            ),
          ),
        ),
        // Result
        el('div', { className: 'engine-inspector-result' },
          el('span', { className: 'engine-inspector-result-label' }, 'RESULT: '),
          el('span', { className: 'engine-inspector-result-value' }, 'CONFLICT_DETECTED'),
        ),
      ),
    ),

    // Message
    el('div', { className: 'conflict-card-message' },
      el('p', {},
        el('strong', {}, 'Both commitments were created independently while disconnected.')
      ),
      el('p', { className: 'mt-2' },
        el('strong', {}, 'PRATIDHWANI will not silently choose one.')
      ),
    ),

    // Action bar (if unresolved)
    !isResolved && !isReopened ? el('div', { className: 'conflict-action-bar' },
      el('button', {
        className: 'btn-resolve-action',
        id: `resolve-${conflict.id}`,
        onClick: options.onResolve || (() => {}),
      }, 'RESOLVE CONFLICT'),
    ) : null,
  );

  return card;
}

/**
 * Compact conflict card for lists
 */
export function ConflictCardCompact(conflict) {
  const state = projectState();
  const proposals = conflict.proposalIds.map(pid => state.proposals[pid]).filter(Boolean);
  if (proposals.length < 2) return el('div', {});

  const [propA, propB] = proposals;

  return el('div', { className: 'card' },
    el('div', { className: 'flex items-center justify-between' },
      el('span', { className: 'mono' }, conflict.resourceName || conflict.resourceId),
      StatusBadge(conflict.status),
    ),
    el('div', { className: 'flex items-center gap-3 mt-2', style: { fontSize: 'var(--text-sm)' } },
      el('span', { className: 'mono-sm' }, `${propA.id} → ${propA.destination}`),
      el('span', { style: { color: 'var(--color-conflict)', fontWeight: '700' } }, 'VS'),
      el('span', { className: 'mono-sm' }, `${propB.id} → ${propB.destination}`),
    ),
  );
}
