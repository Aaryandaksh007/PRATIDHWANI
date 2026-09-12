// ============================================
// EVENT TIMELINE
// Forensic vertical timeline of events
// ============================================

import { el } from '../utils/dom.js';
import { getEventLog, EventTypes } from '../engine/eventStore.js';

const DOT_CLASS_MAP = {
  [EventTypes.INCIDENT_CREATED]:       'incident',
  [EventTypes.EVIDENCE_ADDED]:         'evidence',
  [EventTypes.PROPOSAL_CREATED]:       'proposal',
  [EventTypes.CONFLICT_DETECTED]:      'conflict',
  [EventTypes.RESOLUTION_CREATED]:     'resolution',
  [EventTypes.LATE_PROPOSAL_RECEIVED]: 'late',
  [EventTypes.REVIEW_REOPENED]:        'reopened',
  [EventTypes.NODE_RECONNECTED]:       'reconnect',
  [EventTypes.CORROBORATION_DETECTED]: 'corroboration',
  [EventTypes.EVIDENCE_EXCHANGED]:     'reconnect',
  [EventTypes.ACKNOWLEDGEMENT_ADDED]:  'evidence',
};

const TYPE_CLASS_MAP = {
  [EventTypes.CONFLICT_DETECTED]:      'conflict',
  [EventTypes.RESOLUTION_CREATED]:     'resolution',
  [EventTypes.REVIEW_REOPENED]:        'reopened',
  [EventTypes.LATE_PROPOSAL_RECEIVED]: 'late',
};

function getEventDetail(event) {
  const { type, payload } = event;
  switch (type) {
    case EventTypes.INCIDENT_CREATED:
      return `${payload.incidentType} — ${payload.severity} — ${payload.location}`;
    case EventTypes.EVIDENCE_ADDED:
      return `${payload.description?.substring(0, 80)}...`;
    case EventTypes.PROPOSAL_CREATED:
      return `${payload.resourceName} → ${payload.destination}`;
    case EventTypes.CONFLICT_DETECTED:
      return `${payload.resourceName}: ${payload.proposals?.map(p => p.destination).join(' vs ')}`;
    case EventTypes.RESOLUTION_CREATED:
      return `${payload.decision} — ${payload.reason?.substring(0, 60)}`;
    case EventTypes.LATE_PROPOSAL_RECEIVED:
      return `${payload.resourceName} → ${payload.destination} (late arrival)`;
    case EventTypes.REVIEW_REOPENED:
      return `New incompatible evidence after resolution ${payload.previousResolutionId}`;
    case EventTypes.NODE_RECONNECTED:
      return `${payload.nodeId} reconnected. Exchanging evidence.`;
    case EventTypes.CORROBORATION_DETECTED:
      return `${payload.count} independent observations corroborate a pattern.`;
    default:
      return '';
  }
}

export function EventTimeline(options = {}) {
  const events = options.events || getEventLog();
  const maxItems = options.maxItems || 50;
  const displayEvents = events.slice(-maxItems);

  if (displayEvents.length === 0) {
    return el('div', { className: 'empty-state' },
      el('div', { className: 'empty-state-icon' }, '◎'),
      el('div', {}, 'No events recorded yet.'),
    );
  }

  const timeline = el('div', { className: 'event-timeline stagger' });

  for (const event of displayEvents) {
    const dotClass = DOT_CLASS_MAP[event.type] || '';
    const typeClass = TYPE_CLASS_MAP[event.type] || '';
    const isLate = event.type === EventTypes.LATE_PROPOSAL_RECEIVED;
    const isReopen = event.type === EventTypes.REVIEW_REOPENED;

    const item = el('div', {
      className: `event-timeline-item ${isLate ? 'late-evidence-slide' : ''} ${isReopen ? 'reopen-flash' : ''}`,
    },
      el('div', { className: `event-timeline-dot event-timeline-dot-${dotClass}` }),
      el('div', { className: 'event-timeline-time' }, event.wallTime),
      el('div', { className: 'event-timeline-node' }, event.nodeId),
      el('div', { className: `event-timeline-type ${typeClass ? 'event-timeline-type-' + typeClass : ''}` },
        event.type.replace(/_/g, ' ')
      ),
      el('div', { className: 'event-timeline-id mono-sm' }, event.id),
      el('div', { className: 'event-timeline-detail' }, getEventDetail(event)),
    );

    timeline.appendChild(item);
  }

  return timeline;
}
