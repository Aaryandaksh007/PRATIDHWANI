// ============================================
// CONFLICT CENTER — THE MOST IMPORTANT VIEW
// Shows active conflicts and resolution workflow.
// Connects to demoController for interactive mode.
// ============================================

import { el, mount, showOverlay, hideOverlay, showToast } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';
import { ConflictCard } from '../components/ConflictCard.js';
import { ResolutionPanel, ResolutionRecord } from '../components/ResolutionPanel.js';
import { ReopenBanner } from '../components/ReopenBanner.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { isInteractivePaused, resumeAfterInteractive } from '../demo/demoController.js';

export function ConflictCenter(renderApp) {
  const state = projectState();
  const conflicts = Object.values(state.conflicts);
  const resolutions = Object.values(state.resolutions);
  const reopened = Object.values(state.reopenedReviews);

  const hasConflicts = conflicts.length > 0;
  const hasResolutions = resolutions.length > 0;
  const hasReopened = reopened.length > 0;
  const paused = isInteractivePaused();

  const view = el('div', { className: 'view-enter' },
    // Header
    el('div', { className: 'view-header' },
      el('div', { className: 'section-title' }, 'DECISION INTEGRITY'),
      el('h1', { className: 'view-title' }, 'Conflict Center'),
      el('div', { className: 'view-subtitle' },
        hasConflicts
          ? `${conflicts.length} conflict(s) detected. ${reopened.length} review(s) reopened.`
          : 'No conflicts detected. Monitoring for incompatible commitments.'
      ),
    ),

    // Interactive mode banner (when demo paused at step 9)
    paused ? el('div', { className: 'interactive-resolve-banner fade-in-up' },
      el('div', { className: 'interactive-resolve-icon' }, '👆'),
      el('div', { className: 'interactive-resolve-text' },
        el('div', { className: 'interactive-resolve-title' }, 'YOUR TURN — RESOLVE THE CONFLICT'),
        el('div', { className: 'interactive-resolve-desc' },
          'The demo has paused. Click "RESOLVE CONFLICT" below, select which proposal to accept, then confirm. The demo will continue automatically.'
        ),
      ),
    ) : null,

    // Reopened reviews (most dramatic — show first)
    hasReopened ? el('div', { className: 'command-section' },
      el('div', { className: 'section-title', style: { color: 'var(--color-reopened)' } }, '⚠ REOPENED REVIEWS'),
      ...reopened.map(r => ReopenBanner(r)),
    ) : null,

    // Active conflicts
    hasConflicts ? el('div', { className: 'command-section' },
      el('div', { className: 'section-title' }, 'RESOURCE CONFLICTS'),
      el('div', { className: 'conflict-list' },
        ...conflicts.map(conflict => {
          // Check if this conflict has a late proposal making it a 3-way issue
          const lateProposals = Object.values(state.proposals).filter(
            p => p.isLate && p.resourceId === conflict.resourceId
          );

          return el('div', {},
            ConflictCard(conflict, {
              onResolve: () => {
                showResolutionOverlay(conflict, renderApp);
              },
            }),
            // Show late proposals if any
            ...lateProposals.map(lp =>
              el('div', { className: 'card late-evidence-slide mt-4', style: { borderColor: 'var(--color-reopened-dim)' } },
                el('div', { className: 'flex items-center justify-between' },
                  el('span', { className: 'mono' }, lp.id),
                  StatusBadge('LATE'),
                ),
                el('div', { className: 'mt-2', style: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' } },
                  `${lp.resourceName} → ${lp.destination}`
                ),
                el('div', { className: 'mt-2', style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' } },
                  `Arrived from ${lp.nodeId} after previous resolution`
                ),
              )
            ),
          );
        }),
      ),
    ) : null,

    // Resolutions (audit trail)
    hasResolutions ? el('div', { className: 'command-section mt-8' },
      el('div', { className: 'section-title' }, 'RESOLUTION HISTORY'),
      el('div', { className: 'flex flex-col gap-4 stagger' },
        ...resolutions.map(r => ResolutionRecord(r)),
      ),
    ) : null,

    // Empty state
    !hasConflicts && !hasResolutions ? el('div', { className: 'conflict-center-empty' },
      el('div', { className: 'conflict-center-empty-icon' }, '◎'),
      el('div', { style: { fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-2)' } },
        'No conflicts detected'
      ),
      el('div', { style: { color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 'var(--leading-relaxed)' } },
        'When disconnected nodes create incompatible resource commitments, conflicts will appear here for human resolution.'
      ),
    ) : null,
  );

  return view;
}

function showResolutionOverlay(conflict, renderApp) {
  const panel = ResolutionPanel(conflict, {
    onResolved: (result) => {
      hideOverlay();
      
      // If we're in interactive demo mode, resume auto-play
      if (isInteractivePaused()) {
        resumeAfterInteractive();
      }
      
      if (renderApp) renderApp();
    },
  });

  showOverlay(panel);
}
