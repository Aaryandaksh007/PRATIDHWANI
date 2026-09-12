// ============================================
// INCIDENT DETAIL VIEW
// Deep-dive into a single incident
// ============================================

import { el } from '../utils/dom.js';
import { projectState } from '../engine/stateProjector.js';
import { getEventsByIncident } from '../engine/eventStore.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { EventTimeline } from '../components/EventTimeline.js';
import { getQueryParam, navigate } from '../utils/router.js';

export function IncidentDetail() {
  const incidentId = getQueryParam('id');
  const state = projectState();
  const incident = incidentId ? state.incidents[incidentId] : null;

  if (!incident) {
    return el('div', { className: 'empty-state view-enter' },
      el('div', { className: 'empty-state-icon' }, '◎'),
      el('div', {}, 'Incident not found'),
      el('button', { className: 'nav-link mt-4', onClick: () => navigate('/command') }, '← Back'),
    );
  }

  const events = getEventsByIncident(incidentId);
  const proposals = incident.proposalIds.map(pid => state.proposals[pid]).filter(Boolean);
  const conflicts = incident.conflictIds.map(cid => state.conflicts[cid]).filter(Boolean);
  const resolutions = incident.resolutionIds.map(rid => state.resolutions[rid]).filter(Boolean);
  const corroboration = state.corroborations[incidentId];

  const view = el('div', { className: 'view-enter', style: { maxWidth: '900px', margin: '0 auto' } },
    // Header
    el('div', { className: 'view-header' },
      el('button', { className: 'nav-link', onClick: () => navigate('/command'), style: { marginBottom: 'var(--space-3)', display: 'inline-block' } }, '← Command Center'),
      el('div', { className: 'flex items-center gap-4' },
        el('div', {},
          el('div', { className: 'section-title' }, 'INCIDENT'),
          el('h1', { className: 'view-title' }, `${incident.id} — ${incident.type}`),
        ),
        StatusBadge(incident.status),
      ),
    ),

    // Key info grid
    el('div', { className: 'grid-4 mt-4' },
      infoCard('SEVERITY', incident.severity, incident.severity === 'CRITICAL' ? 'var(--color-conflict)' : 'var(--color-warning)'),
      infoCard('LOCATION', incident.location),
      infoCard('AFFECTED', String(incident.affectedCount || 0)),
      infoCard('EVIDENCE', String(incident.evidenceIds.length)),
    ),

    // Corroboration
    corroboration ? el('div', { className: 'card mt-6', style: { borderColor: 'var(--color-verified-dim)' } },
      el('div', { className: 'flex items-center gap-3' },
        StatusBadge('CORROBORATED'),
        el('span', { style: { fontSize: 'var(--text-sm)' } },
          `${corroboration.count} independent observations from ${corroboration.nodeIds.join(', ')}`
        ),
      ),
    ) : null,

    // Proposals
    proposals.length > 0 ? el('div', { className: 'command-section mt-6' },
      el('div', { className: 'section-title' }, 'PROPOSALS'),
      el('div', { className: 'flex flex-col gap-3' },
        ...proposals.map(p =>
          el('div', { className: 'card' },
            el('div', { className: 'flex items-center justify-between' },
              el('span', { className: 'mono' }, p.id),
              StatusBadge(p.status),
            ),
            el('div', { className: 'mt-2', style: { fontSize: 'var(--text-lg)', fontWeight: '700' } },
              `${p.resourceName} → ${p.destination}`
            ),
            el('div', { className: 'mono-sm text-tertiary mt-2' }, `${p.nodeId} · ${p.createdAt}`),
          )
        ),
      ),
    ) : null,

    // Conflicts
    conflicts.length > 0 ? el('div', { className: 'command-section mt-6' },
      el('div', { className: 'section-title', style: { color: 'var(--color-conflict)' } }, '⚠ CONFLICTS'),
      el('div', { className: 'flex flex-col gap-3' },
        ...conflicts.map(c =>
          el('div', {
            className: 'card',
            style: { borderColor: 'var(--color-conflict-dim)', cursor: 'pointer' },
            onClick: () => navigate('/conflicts'),
          },
            el('div', { className: 'flex items-center justify-between' },
              el('span', { className: 'mono' }, c.id),
              StatusBadge(c.status),
            ),
            el('div', { className: 'mt-2 text-secondary', style: { fontSize: 'var(--text-sm)' } },
              `${c.resourceName}: ${c.proposalIds.join(' vs ')}`
            ),
          )
        ),
      ),
    ) : null,

    // Event history
    el('div', { className: 'command-section mt-6' },
      el('div', { className: 'section-title' }, 'EVENT HISTORY'),
      EventTimeline({ events }),
    ),
  );

  return view;
}

function infoCard(label, value, color) {
  return el('div', { className: 'card text-center' },
    el('div', { style: { fontSize: 'var(--text-xl)', fontWeight: '700', color: color || 'var(--text-primary)' } }, value),
    el('div', { className: 'stat-card-label' }, label),
  );
}
