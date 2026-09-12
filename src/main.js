// ============================================
// PRATIDHWANI — Main Application Bootstrap
// Independent signals. Collective truth. Explicit decisions.
// ============================================

// Styles
import './styles/tokens.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/animations.css';
import './styles/components.css';
import './styles/views.css';

// Router
import { registerRoute, initRouter, navigate, onNavigate, getCurrentRoute } from './utils/router.js';
import { el, mount } from './utils/dom.js';

// Views
import { CommandCenter } from './views/CommandCenter.js';
import { FieldNode } from './views/FieldNode.js';
import { FieldNodesPanel } from './views/FieldNodesPanel.js';
import { SwarmView } from './views/SwarmView.js';
import { ResourceBoard } from './views/ResourceBoard.js';
import { ConflictCenter } from './views/ConflictCenter.js';
import { AuditView } from './views/AuditView.js';
import { IncidentDetail } from './views/IncidentDetail.js';
import { FinalScreen } from './views/FinalScreen.js';

// Demo
import { initDemoPanel, togglePanel } from './demo/demoPanel.js';
import { getCurrentStep } from './demo/demoController.js';

// State
import { getStateSummary } from './engine/stateProjector.js';
import { subscribe } from './engine/eventStore.js';

// ── Register Routes ──

registerRoute('/', () => CommandCenter());
registerRoute('/command', () => CommandCenter());
registerRoute('/nodes', () => FieldNodesPanel());
registerRoute('/node-detail', () => FieldNode());
registerRoute('/swarm', () => SwarmView());
registerRoute('/resources', () => ResourceBoard());
registerRoute('/conflicts', () => ConflictCenter(renderApp));
registerRoute('/audit', () => AuditView());
registerRoute('/incident', () => IncidentDetail());
registerRoute('/final', () => FinalScreen());

// ── Build Navigation ──

function buildNav() {
  const nav = document.getElementById('main-nav');
  const summary = getStateSummary();
  const currentPath = getCurrentRoute() || '/';

  const navContent = el('div', { style: { display: 'contents' } },
    // Brand
    el('div', { className: 'nav-brand' },
      el('div', { className: 'nav-brand-icon' },
        el('div', { className: 'ring ring-outer' }),
        el('div', { className: 'ring ring-mid' }),
        el('div', { className: 'ring ring-inner' }),
      ),
      el('a', { className: 'nav-brand-name', href: '#/', 'aria-label': 'PRATIDHWANI Home' }, 'PRATIDHWANI'),
    ),

    // Links
    el('div', { className: 'nav-links', role: 'menubar' },
      navLink('Command', '/command', currentPath),
      navLink('Nodes', '/nodes', currentPath),
      navLink('Swarm', '/swarm', currentPath),
      navLink('Resources', '/resources', currentPath),
      navLinkWithBadge('Conflicts', '/conflicts', currentPath, summary.activeConflicts, 'conflict', summary.reopenedReviews, 'warning'),
      navLink('Audit', '/audit', currentPath),
    ),

    // Status area
    el('div', { className: 'nav-status' },
      // Demo step indicator
      getCurrentStep() > 0 ?
        el('div', { className: 'mono-sm text-tertiary' },
          `STEP ${getCurrentStep()}/12`
        ) : null,

      // Demo control button
      el('button', {
        className: 'nav-demo-btn',
        onClick: togglePanel,
        'aria-label': 'Toggle demo panel',
        title: 'Press D to toggle',
      }, 'DEMO'),
    ),
  );

  mount(nav, navContent);
}

function navLink(label, path, currentPath) {
  const isActive = currentPath === path || (path === '/command' && currentPath === '/');
  return el('a', {
    className: `nav-link ${isActive ? 'active' : ''}`,
    href: `#${path}`,
    role: 'menuitem',
  }, label);
}

function navLinkWithBadge(label, path, currentPath, count1, type1, count2, type2) {
  const isActive = currentPath === path;
  const link = el('a', {
    className: `nav-link ${isActive ? 'active' : ''}`,
    href: `#${path}`,
    role: 'menuitem',
    style: { position: 'relative' },
  }, label);

  if (count1 > 0) {
    link.appendChild(el('span', { className: `badge badge-${type1}` }, String(count1)));
  } else if (count2 > 0) {
    link.appendChild(el('span', { className: `badge badge-${type2}` }, String(count2)));
  }

  return link;
}

// ── Render App ──

function renderApp() {
  buildNav();
  // Re-render current view
  const currentPath = getCurrentRoute() || '/';
  const hash = `#${currentPath}`;
  // Trigger route re-render
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// ── Initialize ──

function init() {
  buildNav();
  initRouter();
  initDemoPanel(renderApp);

  // Subscribe to events for live nav updates
  subscribe(() => {
    buildNav();
  });

  // Update nav on route change
  onNavigate(() => {
    buildNav();
  });

  console.log(
    '%c PRATIDHWANI %c Independent signals. Collective truth. Explicit decisions.',
    'background: #22c55e; color: #0a0b10; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    'color: #8b8d98; padding: 4px;'
  );
  console.log(
    '%c Press D to open demo controls. Use → to advance steps.',
    'color: #6b6e7b;'
  );
}

// Start
init();
