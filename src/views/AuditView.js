// ============================================
// AUDIT VIEW
// Full forensic event timeline
// ============================================

import { el } from '../utils/dom.js';
import { EventTimeline } from '../components/EventTimeline.js';
import { getEventLog, getEventCount } from '../engine/eventStore.js';

export function AuditView() {
  const events = getEventLog();
  const count = getEventCount();

  const view = el('div', { className: 'audit-view view-enter' },
    el('div', { className: 'audit-header' },
      el('div', {},
        el('div', { className: 'section-title' }, 'FORENSIC RECORD'),
        el('h1', { className: 'view-title' }, 'Audit Timeline'),
        el('div', { className: 'view-subtitle' },
          `${count} immutable event${count !== 1 ? 's' : ''} recorded`
        ),
      ),
      el('div', { className: 'offline-indicator' },
        el('span', { className: 'offline-dot', style: { background: 'var(--color-verified)', animation: 'none' } }),
        `${count} EVENTS`
      ),
    ),

    el('div', { className: 'mt-6' },
      EventTimeline({ events }),
    ),
  );

  return view;
}
