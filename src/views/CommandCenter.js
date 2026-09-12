// ============================================
// COMMAND CENTER — Global Overview
// NOT the hero — the decision-integrity workflow is.
// ============================================

import { el } from '../utils/dom.js';
import { projectState, getStateSummary } from '../engine/stateProjector.js';
import { getAllNodes } from '../engine/nodeManager.js';
import { getEventCount } from '../engine/eventStore.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { NodeCard } from '../components/NodeCard.js';
import { ConflictCardCompact } from '../components/ConflictCard.js';
import { navigate } from '../utils/router.js';

function TransportStrip(nodes) {
  const totalPending = nodes.reduce((sum, n) => sum + (n.bufferSize || 0), 0);
  const totalSynced = getEventCount();

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

export function CommandCenter() {
  const state = projectState();
  const summary = getStateSummary();
  const nodes = getAllNodes();
  const conflicts = Object.values(state.conflicts);
  const incidents = Object.values(state.incidents);
  const reopened = Object.values(state.reopenedReviews);

  const hasData = incidents.length > 0 || summary.totalEvents > 0;

  // If no data yet, show a welcome hero instead of a blank dashboard
  if (!hasData) {
    return el('div', { className: 'view-enter' },
      el('div', { className: 'welcome-hero' },
        // Animated rings
        el('div', { className: 'welcome-hero-rings' },
          el('div', { className: 'welcome-ring welcome-ring-1' }),
          el('div', { className: 'welcome-ring welcome-ring-2' }),
          el('div', { className: 'welcome-ring welcome-ring-3' }),
          el('div', { className: 'welcome-core' }),
        ),

        el('h1', { className: 'welcome-hero-title dramatic-fade', style: { animationDelay: '0.1s' } }, 'PRATIDHWANI'),
        el('div', { className: 'welcome-hero-tagline dramatic-fade', style: { animationDelay: '0.4s' } },
          'Independent signals. Collective truth. Explicit decisions.'
        ),
        el('div', { className: 'welcome-hero-desc dramatic-fade', style: { animationDelay: '0.7s' } },
          'A distributed decision-integrity system for disconnected emergencies. When field stations lose connectivity, they independently gather evidence and commit resources. When they reconnect — conflicts surface, and humans decide.'
        ),

        // IDEA-FOCUSED VISUAL CARDS
        el('div', { className: 'welcome-hero-features dramatic-fade', style: { animationDelay: '0.9s' } },
          el('div', { className: 'welcome-feature-card' },
            el('div', { className: 'welcome-feature-icon' }, '📡'),
            el('div', { className: 'welcome-feature-title' }, 'Offline Swarm'),
            el('div', { className: 'welcome-feature-desc' }, 'Nodes operate independently in disconnected environments without centralized servers.')
          ),
          el('div', { className: 'welcome-feature-card' },
            el('div', { className: 'welcome-feature-icon' }, '⛓️'),
            el('div', { className: 'welcome-feature-title' }, 'Cryptographic Truth'),
            el('div', { className: 'welcome-feature-desc' }, 'Every event is cryptographically signed and stored in an immutable ledger.')
          ),
          el('div', { className: 'welcome-feature-card' },
            el('div', { className: 'welcome-feature-icon' }, '👤'),
            el('div', { className: 'welcome-feature-title' }, 'Human-in-the-Loop'),
            el('div', { className: 'welcome-feature-desc' }, 'Algorithmic conflict detection isolates discrepancies for human command resolution.')
          )
        ),

        el('div', { className: 'welcome-hero-status dramatic-fade', style: { animationDelay: '1.2s', marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center' } },
          el('button', { 
            className: 'btn btn-primary welcome-start-btn',
            style: { padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--text-lg)', cursor: 'pointer', backgroundColor: 'var(--color-primary)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '4px' },
            onClick: async () => {
              const { startAutoPlay } = await import('../demo/demoController.js');
              startAutoPlay();
              // Trigger app re-render
              const { projectState } = await import('../engine/stateProjector.js');
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }
          }, '▶ START SIMULATION'),
          el('div', { className: 'welcome-hero-hint', style: { marginTop: 'var(--space-4)', maxWidth: '600px', textAlign: 'center', color: 'var(--text-secondary)' } },
            'Run the 12-step scenario to watch as field stations go dark, gather evidence independently, and reconnect to reveal conflicting decisions.'
          ),
        ),
      ),

      // Still show field nodes so the user sees the system state
      el('div', { className: 'command-section', style: { marginTop: 'var(--space-8)' } },
        el('div', { className: 'section-title' }, 'FIELD NODES'),
        el('div', { className: 'grid-3' },
          ...nodes.map(n => NodeCard(n)),
        ),
      ),
    );
  }

  const view = el('div', { className: 'view-enter' },
    // Header
    el('div', { className: 'view-header' },
      el('div', { className: 'section-title' }, 'OPERATIONAL OVERVIEW'),
      el('h1', { className: 'view-title' }, 'Command Center'),
      el('div', { className: 'view-subtitle' },
        'Distributed decision integrity status'
      ),
    ),

    // Key stats — conflicts and reopened reviews are DOMINANT
    el('div', { className: 'command-stats stagger' },
      statCard(summary.activeConflicts, 'ACTIVE CONFLICTS', 'conflict'),
      statCard(summary.reopenedReviews, 'REOPENED REVIEWS', 'reopened'),
      statCard(summary.corroborated, 'CORROBORATED', 'verified'),
      statCard(summary.totalIncidents, 'INCIDENTS', 'warning'),
      statCard(summary.offlineNodes, 'NODES OFFLINE', summary.offlineNodes > 0 ? 'warning' : ''),
      statCard(summary.totalProposals, 'PROPOSALS', ''),
    ),

    // Active conflicts (prominent)
    conflicts.length > 0 ? el('div', { className: 'command-section' },
      el('div', { className: 'flex items-center justify-between mb-4' },
        el('div', { className: 'section-title', style: { color: 'var(--color-conflict)', marginBottom: 0 } },
          '⚠ RESOURCE CONFLICTS'
        ),
        el('button', {
          className: 'nav-link',
          onClick: () => navigate('/conflicts'),
          style: { fontSize: 'var(--text-xs)' },
        }, 'VIEW ALL →'),
      ),
      el('div', { className: 'flex flex-col gap-3' },
        ...conflicts.map(c => {
          const card = ConflictCardCompact(c);
          card.style.cursor = 'pointer';
          card.addEventListener('click', () => navigate('/conflicts'));
          return card;
        }),
      ),
    ) : null,

    // Reopened reviews
    reopened.length > 0 ? el('div', { className: 'command-section' },
      el('div', { className: 'section-title', style: { color: 'var(--color-reopened)' } },
        '⚠ REVIEWS REOPENED'
      ),
      ...reopened.map(r =>
        el('div', { className: 'card', style: { borderColor: 'var(--color-reopened-dim)', cursor: 'pointer' }, onClick: () => navigate('/conflicts') },
          el('div', { className: 'flex items-center justify-between' },
            el('span', { style: { fontWeight: '600' } }, 'Review Reopened'),
            StatusBadge('REOPENED'),
          ),
          el('div', { className: 'mt-2', style: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' } },
            `Previous resolution ${r.previousResolutionId} superseded by new evidence from ${r.newProposalId}`
          ),
        )
      ),
    ) : null,

    // Transport strip
    TransportStrip(nodes),

    // Field nodes
    el('div', { className: 'command-section' },
      el('div', { className: 'section-title' }, 'FIELD NODES'),
      el('div', { className: 'grid-3' },
        ...nodes.map(n => NodeCard(n)),
      ),
    ),

    // Incidents
    incidents.length > 0 ? el('div', { className: 'command-section' },
      el('div', { className: 'section-title' }, 'ACTIVE INCIDENTS'),
      el('div', { className: 'grid-auto' },
        ...Object.values(incidents).map(inc =>
          el('div', { className: 'card', style: { cursor: 'pointer' }, onClick: () => navigate(`/incident?id=${inc.id}`) },
            el('div', { className: 'flex items-center justify-between' },
              el('span', { className: 'mono' }, inc.id),
              StatusBadge(inc.status),
            ),
            el('div', { style: { fontSize: 'var(--text-lg)', fontWeight: '600', marginTop: 'var(--space-2)' } }, inc.type),
            el('div', { style: { fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' } }, inc.location),
            el('div', { className: 'incident-card-stats' },
              incidentStat(inc.affectedCount || 0, 'AFFECTED'),
              incidentStat(inc.evidenceIds.length, 'EVIDENCE'),
              incidentStat(inc.proposalIds.length, 'PROPOSALS'),
              incidentStat(inc.conflictIds.length, 'CONFLICTS'),
            ),
          )
        ),
      ),
    ) : null,
  );

  return view;
}

function statCard(value, label, type) {
  const typeClass = type ? `stat-card-${type}` : '';
  return el('div', { className: `stat-card ${typeClass}` },
    el('div', { className: 'stat-card-value' }, String(value)),
    el('div', { className: 'stat-card-label' }, label),
  );
}

function incidentStat(value, label) {
  return el('div', { className: 'incident-stat' },
    el('div', { className: 'incident-stat-value' }, String(value)),
    el('div', { className: 'incident-stat-label' }, label),
  );
}
