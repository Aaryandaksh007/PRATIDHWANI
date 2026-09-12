// ============================================
// LOGICAL CLOCK + DISPLAY TIME
// ============================================

let logicalClock = 100;
let wallOffset = 0; // minutes offset from base time

const BASE_HOUR = 10;
const BASE_MINUTE = 30;

export function tick() {
  logicalClock++;
  wallOffset++;
  return logicalClock;
}

export function getLogicalTime() {
  return logicalClock;
}

export function getWallTime() {
  const totalMinutes = BASE_MINUTE + wallOffset;
  const hours = BASE_HOUR + Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getWallTimeISO() {
  const totalMinutes = BASE_MINUTE + wallOffset;
  const hours = BASE_HOUR + Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `2026-09-12T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
}

export function resetClock() {
  logicalClock = 100;
  wallOffset = 0;
}

export function formatTime(wallTime) {
  return wallTime; // Already formatted
}
