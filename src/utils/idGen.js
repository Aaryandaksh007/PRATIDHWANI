// ============================================
// ID GENERATORS
// ============================================

let counters = {
  EVT: 8820,
  INC: 41,
  P: 180,
  R: 26,
  CON: 10,
};

export function generateId(prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(prefix === 'EVT' ? 4 : 3, '0')}`;
}

export function resetIds() {
  counters = { EVT: 8820, INC: 41, P: 180, R: 26, CON: 10 };
}

// Specific generators for readability
export const evtId = () => generateId('EVT');
export const incId = () => generateId('INC');
export const propId = () => generateId('P');
export const resId = () => generateId('R');
export const conId = () => generateId('CON');
