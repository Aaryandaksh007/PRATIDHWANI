// ============================================
// DEMO CONTROLLER
// 12-step orchestrated demo sequence.
// Each step triggers real engine operations.
// The demo is not hardcoded into the UI — it drives
// the same engine a real user would interact with.
//
// INTERACTIVE MODE: At step 9 (CONFLICT_DETECTED),
// auto-play pauses so the user can manually resolve
// the conflict through the ResolutionPanel.
// ============================================

import { appendEvent, EventTypes, resetEventLog, subscribe } from '../engine/eventStore.js';
import { projectState } from '../engine/stateProjector.js';
import { detectConflicts } from '../engine/conflictEngine.js';
import { createResolution, checkAndReopenReview } from '../engine/resolutionEngine.js';
import { triggerCorroboration } from '../engine/corroborationEngine.js';
import {
  addToNodeBuffer,
  setNodeStatus,
  reconnectNode,
  resetNodes,
  getNodeStatus,
} from '../engine/nodeManager.js';
import { resetIds, propId } from '../utils/idGen.js';
import { resetClock } from '../utils/time.js';
import { NODE_EVIDENCE, CONFLICT_PROPOSALS, RESOLUTION_TEMPLATE } from './seedData.js';

let currentStep = 0;
let incidentId = null;
let proposalIdNorth = null;
let proposalIdSouth = null;
let proposalIdEast = null;
let resolutionId = null;
let onStepCallback = null;
let autoPlayTimer = null;
let interactivePaused = false;  // True when waiting for user to resolve conflict

/**
 * The 12 demo steps
 */
export const DEMO_STEPS = [
  {
    id: 1,
    title: 'Valley Goes Dark',
    description: 'Three field stations go offline. No internet, no cellular signal.',
    act: 'ACT 1',
  },
  {
    id: 2,
    title: 'Node A — Evidence',
    description: 'NODE-A independently reports: Landslide, 7 affected, critical, Nainital.',
    act: 'ACT 2',
  },
  {
    id: 3,
    title: 'Node B — Evidence',
    description: 'NODE-B independently reports: Landslide, 5 affected, shelter overloaded.',
    act: 'ACT 2',
  },
  {
    id: 4,
    title: 'Node C — Evidence',
    description: 'NODE-C independently reports similar event. 3 separate local observations.',
    act: 'ACT 2',
  },
  {
    id: 5,
    title: 'Swarm Corroboration',
    description: '3 independent observations detected. Swarm signal corroborated.',
    act: 'ACT 3',
  },
  {
    id: 6,
    title: 'Proposal: NAINITAL',
    description: 'Station A commits AMBULANCE 01 → NAINITAL. Stored locally.',
    act: 'ACT 4',
  },
  {
    id: 7,
    title: 'Proposal: ALMORA',
    description: 'Station B independently commits AMBULANCE 01 → ALMORA. Stored locally.',
    act: 'ACT 4',
  },
  {
    id: 8,
    title: 'Reconnect',
    description: 'Nodes reconnect. Evidence is exchanged. Incompatible commitments detected.',
    act: 'ACT 5',
  },
  {
    id: 9,
    title: 'Conflict Detected',
    description: 'AMBULANCE 01: NAINITAL vs ALMORA. Two valid commitments that cannot both be true.',
    act: 'ACT 5',
    interactive: true, // Pause here for manual resolution
  },
  {
    id: 10,
    title: 'Human Resolution',
    description: 'Coordinator resolves: AMBULANCE 01 → NAINITAL. Resolution recorded.',
    act: 'ACT 6–7',
  },
  {
    id: 11,
    title: 'Late Evidence',
    description: 'Station C reconnects with Proposal P-203: AMBULANCE 01 → BHIMTAL.',
    act: 'ACT 8',
  },
  {
    id: 12,
    title: 'Review Reopened',
    description: 'New incompatible evidence arrived after resolution. Review reopened.',
    act: 'ACT 8',
  },
];

/**
 * Set callback for step changes
 */
export function onDemoStep(callback) {
  onStepCallback = callback;
}

/**
 * Get current step
 */
export function getCurrentStep() {
  return currentStep;
}

/**
 * Is demo paused for interactive resolution?
 */
export function isInteractivePaused() {
  return interactivePaused;
}

/**
 * Resume auto-play after user manually resolves the conflict.
 * Called from the resolution overlay callback.
 */
export function resumeAfterInteractive() {
  if (!interactivePaused) return;
  interactivePaused = false;
  // The resolution was already created by the ResolutionPanel
  // so we skip step 10 (auto-resolution) and store the resolution ID
  const state = projectState();
  const resolutions = Object.values(state.resolutions);
  if (resolutions.length > 0) {
    resolutionId = resolutions[resolutions.length - 1].id;
  }
  currentStep = 10; // Mark step 10 as done
  notifyStep(10, 'Human Resolution');
  
  // Continue auto-play for steps 11 and 12
  playRemainingSteps();
}

/**
 * Get stored IDs from the demo for UI reference
 */
export function getDemoIds() {
  return {
    incidentId,
    proposalIdNorth,
    proposalIdSouth,
    proposalIdEast,
    resolutionId,
  };
}

/**
 * Reset the entire demo state
 */
export function resetDemo() {
  stopAutoPlay();
  currentStep = 0;
  incidentId = null;
  proposalIdNorth = null;
  proposalIdSouth = null;
  proposalIdEast = null;
  resolutionId = null;
  interactivePaused = false;
  resetEventLog();
  resetNodes();
  resetIds();
  resetClock();
  notifyStep(0, 'RESET');
}

/**
 * Execute a specific step
 */
export function executeStep(stepNumber) {
  if (stepNumber <= currentStep && stepNumber !== 0) return false;

  // Execute all steps up to the target
  while (currentStep < stepNumber) {
    currentStep++;
    runStep(currentStep);
  }

  return true;
}

/**
 * Advance to next step
 */
export function nextStep() {
  if (currentStep >= DEMO_STEPS.length) return false;
  if (interactivePaused) return false; // Block advancing during interactive mode
  currentStep++;
  runStep(currentStep);
  return true;
}

/**
 * Run a specific step's logic
 */
function runStep(step) {
  switch (step) {
    case 1: stepValleyDark(); break;
    case 2: stepNodeAEvidence(); break;
    case 3: stepNodeBEvidence(); break;
    case 4: stepNodeCEvidence(); break;
    case 5: stepCorroboration(); break;
    case 6: stepProposalNorth(); break;
    case 7: stepProposalSouth(); break;
    case 8: stepReconnect(); break;
    case 9: stepConflictDetected(); break;
    case 10: stepHumanResolution(); break;
    case 11: stepLateEvidence(); break;
    case 12: stepReviewReopened(); break;
  }
  notifyStep(step, DEMO_STEPS[step - 1]?.title);
}

function notifyStep(step, title) {
  if (onStepCallback) {
    onStepCallback(step, title, DEMO_STEPS[step - 1] || null);
  }
}

// ── STEP IMPLEMENTATIONS ──

function stepValleyDark() {
  // All nodes are already offline by default
  setNodeStatus('NODE-A', 'OFFLINE');
  setNodeStatus('NODE-B', 'OFFLINE');
  setNodeStatus('NODE-C', 'OFFLINE');
}

function stepNodeAEvidence() {
  incidentId = 'INC-042';
  const evidence = NODE_EVIDENCE.NODE_A;

  // Node A creates incident locally (into its buffer, not the global store)
  addToNodeBuffer('NODE-A', {
    type: EventTypes.INCIDENT_CREATED,
    nodeId: 'NODE-A',
    payload: {
      incidentId,
      ...evidence,
    },
    options: { incidentId },
  });
}

function stepNodeBEvidence() {
  const evidence = NODE_EVIDENCE.NODE_B;

  // Node B adds evidence to the same incident (locally)
  addToNodeBuffer('NODE-B', {
    type: EventTypes.EVIDENCE_ADDED,
    nodeId: 'NODE-B',
    payload: {
      incidentId,
      ...evidence,
    },
    options: { incidentId },
  });
}

function stepNodeCEvidence() {
  const evidence = NODE_EVIDENCE.NODE_C;

  // Node C adds evidence (locally)
  addToNodeBuffer('NODE-C', {
    type: EventTypes.EVIDENCE_ADDED,
    nodeId: 'NODE-C',
    payload: {
      incidentId,
      ...evidence,
    },
    options: { incidentId },
  });
}

function stepCorroboration() {
  // First, merge all node buffers so evidence is in the global store
  reconnectNode('NODE-A');
  reconnectNode('NODE-B');
  reconnectNode('NODE-C');

  // Now trigger corroboration
  triggerCorroboration(incidentId, ['NODE-A', 'NODE-B', 'NODE-C']);

  // Set nodes back to offline for the proposal phase
  setNodeStatus('NODE-A', 'OFFLINE');
  setNodeStatus('NODE-B', 'OFFLINE');
  setNodeStatus('NODE-C', 'OFFLINE');
}

function stepProposalNorth() {
  proposalIdNorth = 'P-184';
  const proposal = CONFLICT_PROPOSALS.STATION_A;

  addToNodeBuffer('NODE-A', {
    type: EventTypes.PROPOSAL_CREATED,
    nodeId: 'NODE-A',
    payload: {
      proposalId: proposalIdNorth,
      ...proposal,
      incidentId,
    },
    options: { incidentId },
  });
}

function stepProposalSouth() {
  proposalIdSouth = 'P-191';
  const proposal = CONFLICT_PROPOSALS.STATION_B;

  addToNodeBuffer('NODE-B', {
    type: EventTypes.PROPOSAL_CREATED,
    nodeId: 'NODE-B',
    payload: {
      proposalId: proposalIdSouth,
      ...proposal,
      incidentId,
    },
    options: { incidentId },
  });
}

function stepReconnect() {
  // Reconnect Node A and Node B — their proposals enter the global store
  reconnectNode('NODE-A');
  reconnectNode('NODE-B');
}

function stepConflictDetected() {
  // Run the conflict engine — it will detect AMB-01 → NAINITAL vs ALMORA
  const conflicts = detectConflicts();
  
  // INTERACTIVE PAUSE: Stop auto-play so user can resolve manually
  if (isAutoPlaying()) {
    stopAutoPlay();
    interactivePaused = true;
  }
  
  return conflicts;
}

function stepHumanResolution() {
  // If resolution was already done interactively, skip
  const state = projectState();
  if (Object.keys(state.resolutions).length > 0) {
    resolutionId = Object.values(state.resolutions)[0].id;
    return;
  }

  // Gather evidence IDs
  const evidenceIds = Object.keys(state.evidence).slice(0, 2);

  const result = createResolution({
    resolvedProposalIds: [proposalIdNorth, proposalIdSouth],
    evidenceConsidered: evidenceIds,
    decision: RESOLUTION_TEMPLATE.decision,
    decidedProposalId: proposalIdNorth,
    reason: RESOLUTION_TEMPLATE.reason,
    decisionMaker: RESOLUTION_TEMPLATE.decisionMaker,
    incidentId,
  });

  resolutionId = result.resolutionId;
  return result;
}

function stepLateEvidence() {
  proposalIdEast = 'P-203';
  const proposal = CONFLICT_PROPOSALS.STATION_C_LATE;

  // Node C reconnects and its late proposal enters the system
  addToNodeBuffer('NODE-C', {
    type: EventTypes.LATE_PROPOSAL_RECEIVED,
    nodeId: 'NODE-C',
    payload: {
      proposalId: proposalIdEast,
      ...proposal,
      incidentId,
    },
    options: { incidentId },
  });

  reconnectNode('NODE-C');
}

function stepReviewReopened() {
  // Check if the late proposal conflicts with the existing resolution
  const state = projectState();
  const lateProposal = state.proposals[proposalIdEast];

  if (lateProposal) {
    const result = checkAndReopenReview(lateProposal);
    return result;
  }
}

// ── AUTO-PLAY ──

const AUTO_PLAY_DELAYS = [
  0,     // step 0 (unused)
  2000,  // step 1: Valley dark
  3000,  // step 2: Node A evidence
  2500,  // step 3: Node B evidence
  2500,  // step 4: Node C evidence
  4000,  // step 5: Corroboration
  3000,  // step 6: Proposal North
  3000,  // step 7: Proposal South
  4000,  // step 8: Reconnect
  4000,  // step 9: Conflict — will pause here for interactive
  5000,  // step 10: Resolution
  4000,  // step 11: Late evidence
  5000,  // step 12: Review reopened
];

export function startAutoPlay() {
  if (currentStep >= DEMO_STEPS.length) {
    resetDemo();
  }

  function playNext() {
    if (currentStep >= DEMO_STEPS.length) {
      stopAutoPlay();
      return;
    }
    if (interactivePaused) {
      // Don't schedule next — we're waiting for user
      stopAutoPlay();
      return;
    }
    const next = currentStep + 1;
    const delayMs = AUTO_PLAY_DELAYS[next] || 3000;
    autoPlayTimer = setTimeout(() => {
      nextStep();
      playNext();
    }, delayMs);
  }

  playNext();
}

/**
 * Continue auto-play for remaining steps after interactive pause
 */
function playRemainingSteps() {
  function playNext() {
    if (currentStep >= DEMO_STEPS.length) {
      stopAutoPlay();
      return;
    }
    const next = currentStep + 1;
    const delayMs = AUTO_PLAY_DELAYS[next] || 3000;
    autoPlayTimer = setTimeout(() => {
      currentStep++;
      runStep(currentStep);
      playNext();
    }, delayMs);
  }
  playNext();
}

export function stopAutoPlay() {
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }
}

export function isAutoPlaying() {
  return autoPlayTimer !== null;
}
