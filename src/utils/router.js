// ============================================
// SIMPLE HASH ROUTER
// ============================================

const routes = {};
let currentRoute = null;
let onNavigateCallback = null;

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

export function onNavigate(callback) {
  onNavigateCallback = callback;
}

function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/';
  const path = hash.split('?')[0];
  currentRoute = path;

  const container = document.getElementById('view-container');
  const renderFn = routes[path] || routes['/'];

  if (renderFn) {
    container.innerHTML = '';
    const view = renderFn();
    if (view instanceof Node) {
      view.classList.add('view-enter');
      container.appendChild(view);
    }
  }

  if (onNavigateCallback) {
    onNavigateCallback(path);
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  // Initial route
  handleRouteChange();
}

export function getQueryParam(key) {
  const hash = window.location.hash.slice(1);
  const queryStr = hash.split('?')[1];
  if (!queryStr) return null;
  const params = new URLSearchParams(queryStr);
  return params.get(key);
}
