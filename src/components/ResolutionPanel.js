// ============================================
// RESOLUTION PANEL
// Human decision workflow for conflict resolution
// ============================================

import { el, mount, showToast } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';
import { createResolution } from '../engine/resolutionEngine.js';

export function ResolutionPanel(conflict, options = {}) {
  const state = projectState();
  const proposals = conflict.proposalIds.map(pid => state.proposals[pid]).filter(Boolean);
  if (proposals.length < 2) return el('div', {}, 'Invalid conflict');

  let selectedProposalId = null;
  let reasonText = '';

  // Gather evidence for this incident
  const incidentId = proposals[0]?.incidentId;
  const incident = incidentId ? state.incidents[incidentId] : null;
  const evidenceIds = incident ? incident.evidenceIds.slice(0, 4) : [];

  const panel = el('div', { className: 'resolution-panel' },
    // Title
    el('h2', { className: 'view-title', style: { textAlign: 'center', marginBottom: 'var(--space-8)' } },
      'RESOLVE CONFLICT'
    ),

    // Resource
    el('div', { className: 'resolution-section' },
      el('div', { className: 'resolution-section-title' }, 'RESOURCE'),
      el('div', { className: 'card', style: { textAlign: 'center' } },
        el('div', { style: { fontSize: 'var(--text-lg)', fontWeight: '600' } },
          conflict.resourceName || conflict.resourceId
        ),
        el('div', { className: 'mono-sm text-tertiary mt-2' }, conflict.resourceId),
      ),
    ),

    // Conflicting proposals
    el('div', { className: 'resolution-section' },
      el('div', { className: 'resolution-section-title' }, 'CONFLICTING PROPOSALS'),
      el('div', { className: 'resolution-options', id: 'resolution-options' },
        ...proposals.map(p => {
          const option = el('div', {
            className: 'resolution-option',
            dataset: { proposalId: p.id },
            onClick: () => {
              selectedProposalId = p.id;
              // Update UI
              document.querySelectorAll('.resolution-option').forEach(o =>
                o.classList.remove('selected')
              );
              option.classList.add('selected');
            },
          },
            el('div', { className: 'resolution-option-destination' }, p.destination),
            el('div', { className: 'resolution-option-proposal mono-sm' }, p.id),
            el('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' } },
              p.nodeId
            ),
          );
          return option;
        }),
      ),
    ),

    // Evidence considered
    el('div', { className: 'resolution-section' },
      el('div', { className: 'resolution-section-title' }, 'EVIDENCE CONSIDERED'),
      el('div', { className: 'resolution-evidence-list' },
        ...evidenceIds.map(evtId => {
          const evidence = state.evidence[evtId];
          return el('div', { className: 'resolution-evidence-item' },
            el('span', { className: 'resolution-evidence-id' }, evtId),
            el('span', { style: { color: 'var(--text-secondary)' } },
              evidence ? `${evidence.nodeId} — ${evidence.incidentType || 'Evidence'}` : 'Evidence'
            ),
          );
        }),
      ),
    ),

    // Reason
    el('div', { className: 'resolution-section' },
      el('div', { className: 'resolution-section-title' }, 'REASON FOR DECISION'),
      el('textarea', {
        className: 'resolution-reason',
        placeholder: 'Higher severity / stronger available evidence...',
        id: 'resolution-reason',
        onInput: (e) => { reasonText = e.target.value; },
      }),
    ),

    // Confirm button
    el('div', { className: 'resolution-section' },
      el('button', {
        className: 'btn-resolve',
        id: 'btn-confirm-resolution',
        onClick: () => {
          if (!selectedProposalId) {
            showToast('Select a proposal to accept.', 'warning');
            return;
          }
          const selectedP = proposals.find(p => p.id === selectedProposalId);
          const result = createResolution({
            resolvedProposalIds: proposals.map(p => p.id),
            evidenceConsidered: evidenceIds,
            decision: selectedP.destination,
            decidedProposalId: selectedProposalId,
            reason: reasonText || 'Higher severity / stronger available evidence',
            decisionMaker: 'COORDINATOR-01',
            incidentId,
          });

          showToast(`Resolution ${result.resolutionId} recorded.`, 'verified');

          if (options.onResolved) {
            options.onResolved(result);
          }
        },
      }, '✓ CONFIRM RESOLUTION'),
    ),
  );

  return panel;
}

/**
 * Resolution record display (post-resolution)
 */
export function ResolutionRecord(resolution) {
  return el('div', { className: 'resolution-record fade-in-up' },
    el('div', { className: 'resolution-record-icon' }, '✓'),
    el('div', { className: 'resolution-record-title' }, 'RESOLUTION RECORDED'),
    el('div', { className: 'resolution-record-details' },
      detailRow('Resolution', resolution.id),
      detailRow('Resolves', resolution.resolvedProposalIds.join(', ')),
      detailRow('Evidence', resolution.evidenceConsidered.join(', ')),
      detailRow('Decision', resolution.decision),
      detailRow('Decided Proposal', resolution.decidedProposalId),
      detailRow('Reason', resolution.reason),
      detailRow('Decision Maker', resolution.decisionMaker),
      detailRow('Status', resolution.status),
    ),
  );
}

function detailRow(label, value) {
  return el('div', { className: 'resolution-detail-row' },
    el('span', { className: 'resolution-detail-label' }, label),
    el('span', { className: 'resolution-detail-value' }, value || '—'),
  );
}
