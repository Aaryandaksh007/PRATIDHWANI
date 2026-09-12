// ============================================
// REOPEN BANNER
// Dramatic display when review is reopened
// Now includes ENGINE LOGIC showing why reopened
// ============================================

import { el } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';

export function ReopenBanner(reopenData) {
  return el('div', { className: 'reopen-banner reopen-flash late-evidence-slide' },
    el('div', { className: 'reopen-banner-title' },
      '⚠ REVIEW REOPENED'
    ),
    el('div', { className: 'reopen-banner-message' },
      'New incompatible evidence arrived after the previous resolution. The previous decision was valid against the evidence available at that time. New evidence changed the decision context.'
    ),
    el('div', { className: 'reopen-banner-details' },
      reopenDetailRow('Previous Resolution', reopenData.previousResolutionId),
      reopenDetailRow('New Proposal', reopenData.newProposalId),
      reopenData.previousDecision ?
        reopenDetailRow('Previous Decision', reopenData.previousDecision) : null,
      reopenData.newProposedDestination ?
        reopenDetailRow('New Proposed', reopenData.newProposedDestination) : null,
    ),

    // ENGINE LOGIC — shows WHY the reopen was triggered
    el('div', { className: 'engine-inspector reopen-engine' },
      el('div', { className: 'engine-inspector-header' },
        el('span', { className: 'engine-inspector-icon' }, '⚙'),
        el('span', {}, 'WHY REOPENED — ENGINE LOGIC'),
      ),
      el('div', { className: 'engine-inspector-body' },
        // The resolved state
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'RESOLVED STATE'),
          el('pre', { className: 'engine-inspector-code' },
            `Resolution ${reopenData.previousResolutionId || 'R-???'}:\n  resource: "${reopenData.resourceId || '???'}"\n  decision: "${reopenData.previousDecision || '???'}"`,
          ),
        ),
        // The late arrival
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'LATE ARRIVAL'),
          el('pre', { className: 'engine-inspector-code' },
            `Proposal ${reopenData.newProposalId || 'P-???'}:\n  resource: "${reopenData.resourceId || '???'}"\n  destination: "${reopenData.newProposedDestination || '???'}"`,
          ),
        ),
        // Detection rule
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'REOPEN RULE'),
          el('pre', { className: 'engine-inspector-code' },
            `resolution.resourceId == lateProposal.resourceId\nresolution.decision != lateProposal.destination\n→ REVIEW_REOPENED`,
          ),
        ),
        // Evaluation
        el('div', { className: 'engine-inspector-section' },
          el('div', { className: 'engine-inspector-label' }, 'EVALUATION'),
          el('div', { className: 'engine-inspector-eval' },
            el('div', { className: 'engine-eval-row' },
              el('span', { className: 'engine-eval-check mono-sm' },
                `"${reopenData.resourceId || '???'}" == "${reopenData.resourceId || '???'}"`,
              ),
              el('span', { className: 'engine-eval-result pass' }, '✓ SAME RESOURCE'),
            ),
            el('div', { className: 'engine-eval-row' },
              el('span', { className: 'engine-eval-check mono-sm' },
                `"${reopenData.previousDecision || '???'}" != "${reopenData.newProposedDestination || '???'}"`,
              ),
              el('span', { className: 'engine-eval-result pass' }, '✓ INCOMPATIBLE'),
            ),
          ),
        ),
        // Result
        el('div', { className: 'engine-inspector-result' },
          el('span', { className: 'engine-inspector-result-label' }, 'RESULT: '),
          el('span', { className: 'engine-inspector-result-value reopen-result' }, 'REVIEW_REOPENED'),
        ),
      ),
    ),
  );
}

function reopenDetailRow(label, value) {
  if (!value) return null;
  return el('div', { className: 'reopen-detail-row' },
    el('span', { className: 'reopen-detail-label' }, label),
    el('span', { className: 'reopen-detail-value mono' }, value),
  );
}
