// ============================================
// FINAL SCREEN — Cinematic closing
// ============================================

import { el } from '../utils/dom.js';

export function FinalScreen() {
  return el('div', { className: 'final-screen view-enter' },
    el('div', { className: 'final-screen-pre dramatic-fade', style: { animationDelay: '0.3s' } },
      'THE MESSAGES ARRIVED.'
    ),
    el('div', { className: 'final-screen-pre dramatic-fade', style: { animationDelay: '1.2s' } },
      'THE PLANS STILL DISAGREED.'
    ),

    el('div', { className: 'dramatic-reveal', style: { animationDelay: '2.5s' } },
      el('div', { className: 'final-screen-brand' }, 'PRATIDHWANI'),
    ),

    el('div', { className: 'dramatic-fade', style: { animationDelay: '3.5s' } },
      el('div', { className: 'final-screen-tagline' },
        'Independent signals. Collective truth. Explicit decisions.'
      ),
    ),

    el('div', { className: 'dramatic-fade', style: { animationDelay: '4.5s' } },
      el('div', { className: 'final-screen-quote' },
        '"We built a system that knows the difference between data arriving and people agreeing."'
      ),
    ),
  );
}
