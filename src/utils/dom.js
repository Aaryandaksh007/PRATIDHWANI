// ============================================
// DOM HELPER UTILITIES
// ============================================

/**
 * Create an element with classes, attributes, and children.
 */
export function el(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [dk, dv] of Object.entries(value)) {
        element.dataset[dk] = dv;
      }
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (child == null || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => {
        if (c instanceof Node) element.appendChild(c);
      });
    }
  }

  return element;
}

/**
 * Clear a container and mount new content
 */
export function mount(container, ...children) {
  container.innerHTML = '';
  for (const child of children) {
    if (child instanceof Node) {
      container.appendChild(child);
    }
  }
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'default', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = el('div', { className: `toast toast-${type}` }, message);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 150);
  }, duration);
}

/**
 * Show overlay modal
 */
export function showOverlay(content) {
  const container = document.getElementById('overlay-container');
  const wrapper = el('div', { className: 'overlay-content' }, content);
  container.innerHTML = '';
  container.appendChild(wrapper);
  container.classList.add('active');
}

/**
 * Hide overlay
 */
export function hideOverlay() {
  const container = document.getElementById('overlay-container');
  container.classList.remove('active');
  setTimeout(() => { container.innerHTML = ''; }, 300);
}

/**
 * Delay utility for animations
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add animation class, remove after completion
 */
export function animate(element, animClass, durationMs = 1000) {
  return new Promise(resolve => {
    element.classList.add(animClass);
    setTimeout(() => {
      element.classList.remove(animClass);
      resolve();
    }, durationMs);
  });
}
