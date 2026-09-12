// ============================================
// RESOURCE CARD
// Shows resource status in the resource board
// ============================================

import { el } from '../utils/dom.js';
import { StatusBadge } from './StatusBadge.js';

export function ResourceCard(resource) {
  const statusClass = resource.status === 'CONFLICTED' ? 'resource-card-conflicted' :
                      resource.status === 'RESOLVED' ? 'resource-card-resolved' :
                      resource.status === 'UNDER_REVIEW' ? 'resource-card-under-review' : '';

  return el('div', { className: `resource-card ${statusClass}` },
    el('div', { className: 'flex items-center justify-between' },
      el('div', {},
        el('div', { className: 'resource-card-name' }, resource.name),
        el('div', { className: 'resource-card-id' }, resource.id),
      ),
      StatusBadge(resource.status),
    ),
    resource.committedTo ? el('div', { className: 'resource-card-commitment mono-sm' },
      `→ ${resource.committedTo}`
    ) : null,
    resource.proposals && resource.proposals.length > 0 ?
      el('div', { className: 'resource-card-commitment', style: { fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' } },
        `${resource.proposals.length} proposal(s)`
      ) : null,
  );
}
