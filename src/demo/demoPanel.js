// ============================================
// DEMO PANEL UI
// Slide-out panel for presenter control.
// Shows interactive mode indicator at step 9.
// ============================================

import { el, mount, showToast } from '../utils/dom.js';
import {
  DEMO_STEPS,
  getCurrentStep,
  nextStep,
  executeStep,
  resetDemo,
  startAutoPlay,
  stopAutoPlay,
  isAutoPlaying,
  isInteractivePaused,
  onDemoStep,
} from './demoController.js';
import { navigate } from '../utils/router.js';

let panelEl = null;
let isOpen = true;
let renderApp = null;
let hasAutoStarted = false;

/**
 * Initialize the demo panel
 */
export function initDemoPanel(appRenderFn) {
  renderApp = appRenderFn;

  // Listen for step changes
  onDemoStep((step, title, stepDef) => {
    updatePanel();
    if (renderApp) renderApp();

    // Auto-navigate to relevant views
    if (step === 1 || step === 2 || step === 3 || step === 4) navigate('/nodes');
    else if (step === 5) navigate('/swarm');
    else if (step === 6 || step === 7) navigate('/nodes');
    else if (step === 8) navigate('/command');
    else if (step === 9) navigate('/conflicts');
    else if (step === 10) navigate('/conflicts');
    else if (step === 11) navigate('/audit');
    else if (step === 12) navigate('/conflicts');

    // Show toast for key moments
    if (step > 0 && stepDef) {
      const toastType = step === 9 ? 'conflict' :
                        step === 12 ? 'warning' :
                        step === 10 ? 'verified' : 'default';
      showToast(`Step ${step}: ${stepDef.title}`, toastType, 3000);
    }

    // Interactive mode toast
    if (step === 9 && isInteractivePaused()) {
      setTimeout(() => {
        showToast('YOUR TURN — Click "RESOLVE CONFLICT" to decide', 'conflict', 8000);
      }, 1500);
    }
  });

  // Keyboard shortcut: 'D' key toggles panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      togglePanel();
    }
    // Right arrow = next step
    if (e.key === 'ArrowRight' && isOpen) {
      e.preventDefault();
      nextStep();
    }
    // 'R' = reset
    if (e.key === 'r' && isOpen && !e.ctrlKey && !e.metaKey) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      resetDemo();
      if (renderApp) renderApp();
    }
  });

  buildPanel();

  // Auto-start the demo after a brief delay so the user sees it working
  setTimeout(() => {
    if (!hasAutoStarted && getCurrentStep() === 0) {
      hasAutoStarted = true;
      startAutoPlay();
      updatePanel();
    }
  }, 800);
}

export function togglePanel() {
  isOpen = !isOpen;
  if (panelEl) {
    panelEl.classList.toggle('demo-panel-open', isOpen);
  }
}

function buildPanel() {
  const container = document.getElementById('demo-panel-container');
  panelEl = el('div', { className: 'demo-panel demo-panel-open' });
  container.appendChild(panelEl);
  updatePanel();
}

function updatePanel() {
  if (!panelEl) return;
  const step = getCurrentStep();
  const playing = isAutoPlaying();
  const paused = isInteractivePaused();

  const content = el('div', { className: 'demo-panel-inner' },
    // Header
    el('div', { className: 'demo-panel-header' },
      el('div', { className: 'demo-panel-title' }, 'DEMO CONTROL'),
      el('div', { className: 'demo-panel-subtitle mono-sm' }, 'SIMULATED P2P TRANSPORT'),
    ),

    // Interactive mode banner
    paused ? el('div', { className: 'demo-interactive-banner' },
      el('div', { className: 'demo-interactive-icon' }, '👆'),
      el('div', { className: 'demo-interactive-title' }, 'YOUR TURN'),
      el('div', { className: 'demo-interactive-desc' },
        'Click "RESOLVE CONFLICT" on the conflict card, then select a proposal and confirm.'
      ),
    ) : null,

    // Controls
    el('div', { className: 'demo-panel-controls' },
      paused
        ? el('button', {
            className: 'demo-btn demo-btn-interactive',
            disabled: true,
          }, '⏸ WAITING FOR YOU...')
        : el('button', {
            className: 'demo-btn demo-btn-primary',
            onClick: () => {
              if (playing) { stopAutoPlay(); updatePanel(); }
              else { startAutoPlay(); updatePanel(); }
            },
          }, playing ? '⏸ PAUSE' : '▶ RUN 3-MIN DEMO'),

      el('button', {
        className: 'demo-btn demo-btn-secondary',
        onClick: () => nextStep(),
        disabled: paused,
      }, '→ NEXT STEP'),

      el('button', {
        className: 'demo-btn demo-btn-ghost',
        onClick: () => { resetDemo(); if (renderApp) renderApp(); },
      }, '↺ RESET'),
    ),

    // Progress
    el('div', { className: 'demo-panel-progress' },
      el('div', { className: 'demo-progress-bar' },
        el('div', {
          className: `demo-progress-fill ${paused ? 'demo-progress-paused' : ''}`,
          style: { width: `${(step / DEMO_STEPS.length) * 100}%` },
        }),
      ),
      el('div', { className: 'demo-progress-label mono-sm' },
        paused ? `${step} / ${DEMO_STEPS.length} — INTERACTIVE` : `${step} / ${DEMO_STEPS.length}`
      ),
    ),

    // Steps list
    el('div', { className: 'demo-steps-list' },
      ...DEMO_STEPS.map(s => {
        const isCurrent = s.id === step;
        const isDone = s.id < step;
        const isFuture = s.id > step;
        const isInteractive = s.interactive && isCurrent && paused;

        return el('button', {
          className: `demo-step-item ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''} ${isFuture ? 'future' : ''} ${isInteractive ? 'interactive' : ''}`,
          onClick: () => { if (!paused) executeStep(s.id); },
          disabled: paused && s.id > step,
        },
          el('div', { className: 'demo-step-number mono-sm' },
            isDone ? '✓' : isInteractive ? '👆' : String(s.id).padStart(2, '0')
          ),
          el('div', { className: 'demo-step-info' },
            el('div', { className: 'demo-step-title' }, s.title),
            el('div', { className: 'demo-step-desc' }, s.description),
          ),
          el('div', { className: `demo-step-act mono-sm` }, s.act),
        );
      })
    ),

    // Footer
    el('div', { className: 'demo-panel-footer' },
      el('div', { className: 'demo-shortcut' },
        el('kbd', {}, 'D'), ' Toggle panel'
      ),
      el('div', { className: 'demo-shortcut' },
        el('kbd', {}, '→'), ' Next step'
      ),
      el('div', { className: 'demo-shortcut' },
        el('kbd', {}, 'R'), ' Reset'
      ),
    ),
  );

  mount(panelEl, content);
}
