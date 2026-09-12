// ============================================
// STATUS BADGE
// Semantic colored badge component
// ============================================

import { el } from '../utils/dom.js';

const STATUS_MAP = {
  'OFFLINE':            'offline',
  'ONLINE':             'online',
  'VERIFIED':           'verified',
  'CONFLICT':           'conflict',
  'CONFLICTED':         'conflict',
  'AWAITING_RESOLUTION':'conflict',
  'WARNING':            'warning',
  'RESOLVED':           'resolved',
  'REOPENED':           'reopened',
  'ACTIVE':             'active',
  'AVAILABLE':          'available',
  'COMMITTED':          'committed',
  'LATE':               'late',
  'CORROBORATED':       'corroborated',
  'UNDER_REVIEW':       'under-review',
  'SUPERSEDED':         'superseded',
  'ACCEPTED':           'verified',
  'REJECTED':           'superseded',
};

export function StatusBadge(status) {
  const cls = STATUS_MAP[status] || 'available';
  const label = status.replace(/_/g, ' ');

  return el('span', { className: `status-badge badge-${cls}` },
    el('span', { className: 'status-badge-dot' }),
    label,
  );
}
