// ============================================
// SEED DATA
// Realistic fictional data for the demo.
// ============================================

export const LOCATIONS = {
  NAINITAL:      'Nainital',
  ALMORA:        'Almora',
  BHIMTAL:       'Bhimtal',
  BASE_CAMP:     'Base Camp',
  DISTRICT_CR:   'District Control Room',
};

export const RESOURCES = [
  { id: 'AMB-01',  name: 'Ambulance 01',       type: 'VEHICLE',  status: 'AVAILABLE' },
  { id: 'AMB-02',  name: 'Ambulance 02',       type: 'VEHICLE',  status: 'AVAILABLE' },
  { id: 'RSC-01',  name: 'Rescue Vehicle 01',  type: 'VEHICLE',  status: 'AVAILABLE' },
  { id: 'MED-A',   name: 'Medical Team Alpha', type: 'TEAM',     status: 'AVAILABLE' },
  { id: 'SHL-N',   name: 'Shelter Nainital',      type: 'FACILITY', status: 'AVAILABLE' },
  { id: 'WTR-01',  name: 'Water Supply Unit',  type: 'SUPPLY',   status: 'AVAILABLE' },
];

export const INCIDENT_TEMPLATES = {
  LANDSLIDE_NAINITAL: {
    incidentType: 'LANDSLIDE',
    severity: 'CRITICAL',
    location: LOCATIONS.NAINITAL,
    description: 'Major landslide reported. Road access blocked. Multiple structures affected.',
  },
};

export const NODE_EVIDENCE = {
  NODE_A: {
    incidentType: 'LANDSLIDE',
    severity: 'CRITICAL',
    location: LOCATIONS.NAINITAL,
    affectedCount: 7,
    description: 'Landslide confirmed. 7 people affected. Critical injuries. Medical assistance required immediately.',
    needs: 'MEDICAL_ASSISTANCE',
  },
  NODE_B: {
    incidentType: 'LANDSLIDE',
    severity: 'CRITICAL',
    location: LOCATIONS.NAINITAL,
    affectedCount: 5,
    description: 'Landslide observed. 5 people affected. Shelter overloaded. Structural damage to 3 buildings.',
    needs: 'SHELTER_CAPACITY',
  },
  NODE_C: {
    incidentType: 'LANDSLIDE',
    severity: 'HIGH',
    location: LOCATIONS.NAINITAL,
    affectedCount: 4,
    description: 'Landslide debris blocking Bhimtal approach. 4 additional affected. Access route compromised.',
    needs: 'ROUTE_CLEARANCE',
  },
};

// The proposals that create the conflict
export const CONFLICT_PROPOSALS = {
  STATION_A: {
    resourceId: 'AMB-01',
    resourceName: 'Ambulance 01',
    destination: 'NAINITAL',
    reason: 'Critical injuries at Nainital require immediate ambulance dispatch.',
  },
  STATION_B: {
    resourceId: 'AMB-01',
    resourceName: 'Ambulance 01',
    destination: 'ALMORA',
    reason: 'Mass casualty staging area established at Almora. Ambulance needed for triage transport.',
  },
  STATION_C_LATE: {
    resourceId: 'AMB-01',
    resourceName: 'Ambulance 01',
    destination: 'BHIMTAL',
    reason: 'Bhimtal approach collapse. Ambulance needed for evacuation via alternate route.',
  },
};

// Resolution template
export const RESOLUTION_TEMPLATE = {
  decision: 'NAINITAL',
  reason: 'Higher severity. Stronger available evidence. 7 people with critical injuries at Nainital.',
  decisionMaker: 'COORDINATOR-01',
};
