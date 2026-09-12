// ============================================
// NODE CARD
// Displays a field node's status and info
// ============================================

import { el } from '../utils/dom.js';
import { StatusBadge } from './StatusBadge.js';

export function NodeCard(node) {
  const statusClass = node.status === 'OFFLINE' ? 'node-card-offline' : 'node-card-online';

  return el('div', { className: `node-card ${statusClass}` },
    el('div', { className: 'node-card-header' },
      el('span', { className: 'node-card-id' }, node.id),
      StatusBadge(node.status),
    ),
    el('div', { className: 'node-card-name' }, node.name || ''),
    el('div', { className: 'node-card-meta' },
      node.location ? el('span', { className: 'node-card-meta-item' },
        '📍 ', node.location
      ) : null,
      el('span', { className: 'node-card-meta-item' },
        `${node.eventCount || 0} events`
      ),
      node.bufferSize > 0 ? el('span', { className: 'node-card-meta-item' },
        `${node.bufferSize} pending`
      ) : null,
    ),
  );
}
