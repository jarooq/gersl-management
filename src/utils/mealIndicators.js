/**
 * GER Standard Indicator Bank (Annex A)
 * Comprehensive MEAL indicators for all programme areas
 * Based on GER MEAL Document
 */

export const STANDARD_INDICATORS = {
  'Orphan Sponsorship': {
    activities: [
      {
        indicator: '# home or school visits conducted',
        definition: 'Number of scheduled monitoring or follow-up visits completed in the reporting period',
        formula: 'Count of visits',
        disaggregation: ['Country'],
        mov: 'Visit log, photo evidence',
        tier: [1, 2, 3]
      },
      {
        indicator: '# beneficiary orientation or guardian briefings held',
        definition: 'Count of orientation sessions to explain programme support and accountability channels',
        formula: 'Count of sessions',
        disaggregation: ['Country'],
        mov: 'Attendance list, minutes',
        tier: [1, 2]
      },
      {
        indicator: '% scheduled disbursements completed on time',
        definition: '(On-time payments ÷ total scheduled) × 100',
        formula: '(OnTime / Total) * 100',
        disaggregation: ['Country'],
        mov: 'Finance log',
        tier: [1, 2]
      },
      {
        indicator: '# staff or volunteers trained on sponsorship MEAL',
        definition: 'Participants completing training/orientation',
        formula: 'Count of participants',
        disaggregation: ['Gender', 'Country'],
        mov: 'Training attendance sheet',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# children sponsored',
        definition: 'Total children receiving active sponsorship in reporting period',
        formula: 'Count of active sponsorships',
        disaggregation: ['Gender', 'Age-band', 'Country'],
        mov: 'Sponsorship register, payment list',
        tier: [1, 2, 3]
      },
      {
        indicator: '% children receiving full support on time',
        definition: '(Children paid on time ÷ total children) × 100',
        formula: '(PaidOnTime / Total) * 100',
        disaggregation: ['Country'],
        mov: 'Finance & remittance logs',
        tier: [1, 2]
      }
    ],
    outcomes: [
      {
        indicator: 'School attendance rate',
        definition: '(Children attending ≥ 90% of school days ÷ eligible sponsored children) × 100',
        formula: '(Attending / Eligible) * 100',
        disaggregation: ['Gender', 'Country'],
        mov: 'School verification forms',
        tier: [1, 2]
      },
      {
        indicator: '% guardians reporting improved well-being',
        definition: '(Guardians reporting improved food, shelter or education access ÷ total surveyed) × 100',
        formula: '(Improved / Surveyed) * 100',
        disaggregation: ['Gender of guardian', 'Country'],
        mov: 'Post-support survey',
        tier: [1]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per sponsored child',
        definition: 'Total sponsorship expenditure ÷ number of children supported',
        formula: 'TotalExpenditure / NumberOfChildren',
        disaggregation: ['Country'],
        mov: 'Finance ledger, results summary',
        tier: [1]
      }
    ],
    accountability: [
      {
        indicator: '% complaints resolved within SLA',
        definition: '(Complaints resolved within set timeframe ÷ total received) × 100',
        formula: '(ResolvedOnTime / Total) * 100',
        disaggregation: ['Country'],
        mov: 'CFM register',
        tier: [1]
      }
    ]
  },

  'Education': {
    activities: [
      {
        indicator: '# school visits or monitoring sessions conducted',
        definition: 'Visits to schools to verify enrollment and attendance',
        formula: 'Count of visits',
        disaggregation: ['Country'],
        mov: 'Visit log, photos',
        tier: [1, 2, 3]
      },
      {
        indicator: '# teacher or partner orientation sessions held',
        definition: 'Meetings to explain project objectives and MEAL tools',
        formula: 'Count of sessions',
        disaggregation: ['Country'],
        mov: 'Meeting minutes',
        tier: [1, 2]
      },
      {
        indicator: '# education support kits procured and pre-positioned',
        definition: 'Procurement timeliness indicator',
        formula: 'Count of kits procured',
        disaggregation: ['Country'],
        mov: 'Procurement records',
        tier: [1, 2]
      },
      {
        indicator: '# staff trained on child-safeguarding in schools',
        definition: 'Training sessions conducted',
        formula: 'Count of participants',
        disaggregation: ['Gender', 'Country'],
        mov: 'Attendance sheet',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# children receiving school kits/support',
        definition: 'Total children supported during year',
        formula: 'Count of beneficiaries',
        disaggregation: ['Gender', 'Grade', 'Country'],
        mov: 'Distribution list',
        tier: [1, 2, 3]
      }
    ],
    outcomes: [
      {
        indicator: '% children retained in school 12 months',
        definition: '(Still enrolled ÷ total supported) × 100',
        formula: '(Retained / Total) * 100',
        disaggregation: ['Gender', 'Grade'],
        mov: 'School records',
        tier: [1, 2]
      },
      {
        indicator: '% improvement in test scores',
        definition: '(Endline − baseline) ÷ baseline × 100',
        formula: '((Endline - Baseline) / Baseline) * 100',
        disaggregation: ['Gender', 'Grade'],
        mov: 'Assessments',
        tier: [1]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per child supported',
        definition: 'Total programme cost ÷ children reached',
        formula: 'TotalCost / ChildrenReached',
        disaggregation: ['Country'],
        mov: 'Finance records',
        tier: [1, 2]
      }
    ],
    accountability: [
      {
        indicator: '# feedback cases resolved',
        definition: 'Resolved ÷ received × 100',
        formula: '(Resolved / Received) * 100',
        disaggregation: ['Country'],
        mov: 'CFM register',
        tier: [1]
      }
    ]
  },

  'WASH': {
    activities: [
      {
        indicator: '# construction supervision or monitoring visits',
        definition: 'Number of site visits conducted during implementation',
        formula: 'Count of visits',
        disaggregation: ['Country', 'Tech type'],
        mov: 'Visit log, photos',
        tier: [1, 2, 3]
      },
      {
        indicator: '# community consultations or orientation meetings',
        definition: 'Sessions with beneficiaries on design, use, maintenance',
        formula: 'Count of sessions',
        disaggregation: ['Country'],
        mov: 'Meeting minutes',
        tier: [1, 2]
      },
      {
        indicator: '# staff or contractors trained on quality standards',
        definition: 'Participants trained in WASH construction standards',
        formula: 'Count of participants',
        disaggregation: ['Gender', 'Country'],
        mov: 'Training register',
        tier: [1, 2]
      },
      {
        indicator: '% materials procured on time',
        definition: '(Items received before deadline ÷ planned) × 100',
        formula: '(OnTime / Planned) * 100',
        disaggregation: ['Country'],
        mov: 'Procurement record',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# water points constructed/rehabilitated',
        definition: 'Functional wells/hand-pumps/systems completed',
        formula: 'Count of water points',
        disaggregation: ['Country', 'Tech type'],
        mov: 'Completion report',
        tier: [1, 2, 3]
      },
      {
        indicator: '# beneficiaries with improved access to safe water',
        definition: 'Estimated users per completed point × # points',
        formula: 'UsersPerPoint * NumberOfPoints',
        disaggregation: ['Gender', 'Location'],
        mov: 'Site verification',
        tier: [1, 2]
      }
    ],
    outcomes: [
      {
        indicator: '% water points functional after 12 months',
        definition: '(Functional ÷ total) × 100',
        formula: '(Functional / Total) * 100',
        disaggregation: ['Country'],
        mov: 'Maintenance records',
        tier: [1, 2]
      },
      {
        indicator: '% samples passing quality test',
        definition: '(Samples meeting standard ÷ total) × 100',
        formula: '(Passing / Total) * 100',
        disaggregation: ['Country'],
        mov: 'Lab results',
        tier: [1]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per beneficiary served',
        definition: 'Total WASH expenditure ÷ users',
        formula: 'TotalExpenditure / TotalUsers',
        disaggregation: ['Country'],
        mov: 'Finance summary',
        tier: [1, 2]
      }
    ],
    accountability: [
      {
        indicator: '# community committees trained on maintenance',
        definition: 'Local maintenance committees trained and active',
        formula: 'Count of committees',
        disaggregation: ['Country'],
        mov: 'Attendance sheets',
        tier: [1]
      }
    ]
  },

  'Livelihood': {
    activities: [
      {
        indicator: '# beneficiary training sessions conducted',
        definition: 'Trainings on skills or business management',
        formula: 'Count of sessions',
        disaggregation: ['Gender', 'Type'],
        mov: 'Attendance sheet',
        tier: [1, 2, 3]
      },
      {
        indicator: '# asset distribution events held',
        definition: 'Livelihood asset distributions completed',
        formula: 'Count of events',
        disaggregation: ['Country'],
        mov: 'Distribution log',
        tier: [1, 2]
      },
      {
        indicator: '% planned activities completed on schedule',
        definition: '(On-time activities ÷ planned) × 100',
        formula: '(OnTime / Planned) * 100',
        disaggregation: ['Country'],
        mov: 'Workplan tracker',
        tier: [1, 2]
      },
      {
        indicator: '# post-distribution follow-ups conducted',
        definition: 'Monitoring visits after asset delivery',
        formula: 'Count of visits',
        disaggregation: ['Country'],
        mov: 'Visit log',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# beneficiaries trained or supported',
        definition: 'Individuals/HHs receiving assets or training',
        formula: 'Count of beneficiaries',
        disaggregation: ['Gender', 'Type'],
        mov: 'Distribution log',
        tier: [1, 2, 3]
      }
    ],
    outcomes: [
      {
        indicator: '% beneficiaries generating income post-support',
        definition: '(With income ÷ total supported) × 100',
        formula: '(WithIncome / Total) * 100',
        disaggregation: ['Gender', 'Type'],
        mov: 'Follow-up survey',
        tier: [1, 2]
      },
      {
        indicator: 'Avg % increase in household income',
        definition: '(Post − baseline) ÷ baseline × 100',
        formula: '((Post - Baseline) / Baseline) * 100',
        disaggregation: ['Gender', 'Type'],
        mov: 'Survey',
        tier: [1]
      },
      {
        indicator: '% supported businesses active after 12 months',
        definition: '(Active ÷ total supported) × 100',
        formula: '(Active / Total) * 100',
        disaggregation: ['Gender of owner'],
        mov: 'Verification',
        tier: [1]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per beneficiary supported',
        definition: 'Total cost ÷ beneficiaries',
        formula: 'TotalCost / Beneficiaries',
        disaggregation: ['Country'],
        mov: 'Finance report',
        tier: [1, 2]
      }
    ],
    accountability: [
      {
        indicator: '% feedback cases resolved',
        definition: '(Resolved ÷ received) × 100',
        formula: '(Resolved / Received) * 100',
        disaggregation: ['Country'],
        mov: 'CFM register',
        tier: [1]
      }
    ]
  },

  'Seasonal Relief': {
    activities: [
      {
        indicator: '# distribution events conducted',
        definition: 'Total relief distribution activities completed',
        formula: 'Count of events',
        disaggregation: ['Country', 'Season'],
        mov: 'Distribution log, photos',
        tier: [1, 2, 3]
      },
      {
        indicator: '% activities completed as per schedule',
        definition: '(Activities on time ÷ planned) × 100',
        formula: '(OnTime / Planned) * 100',
        disaggregation: ['Country'],
        mov: 'Workplan tracker',
        tier: [1, 2]
      },
      {
        indicator: '# staff/volunteers briefed on CFM and safeguarding',
        definition: 'Individuals trained before distribution',
        formula: 'Count of participants',
        disaggregation: ['Gender', 'Country'],
        mov: 'Attendance sheet',
        tier: [1, 2]
      },
      {
        indicator: '# community coordination meetings held',
        definition: 'Meetings with local leaders to plan and validate beneficiary lists',
        formula: 'Count of meetings',
        disaggregation: ['Country'],
        mov: 'Meeting minutes',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# households reached with relief packages',
        definition: 'Total households receiving food/qurban/winter items',
        formula: 'Count of households',
        disaggregation: ['Country', 'Area type (urban/rural)'],
        mov: 'Distribution list, photos',
        tier: [1, 2, 3]
      },
      {
        indicator: '% target reached by campaign end',
        definition: '(Households reached ÷ target) × 100',
        formula: '(Reached / Target) * 100',
        disaggregation: ['Country'],
        mov: 'Distribution tracker',
        tier: [1, 2]
      }
    ],
    outcomes: [
      {
        indicator: 'Beneficiary satisfaction score',
        definition: 'Average rating (1–5) of quality & timeliness',
        formula: 'Average rating',
        disaggregation: ['Gender', 'Location'],
        mov: 'Post-distribution survey',
        tier: [1, 2]
      },
      {
        indicator: '% households reporting improved food security',
        definition: '(HHs reporting improved access ÷ surveyed) × 100',
        formula: '(Improved / Surveyed) * 100',
        disaggregation: ['Gender', 'HH type'],
        mov: 'Survey',
        tier: [1]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per household served',
        definition: 'Total intervention cost ÷ households reached',
        formula: 'TotalCost / HouseholdsReached',
        disaggregation: ['Country'],
        mov: 'Finance ledger',
        tier: [1, 2]
      }
    ],
    accountability: [
      {
        indicator: '# feedback cases logged & addressed',
        definition: 'Total complaints/suggestions resolved',
        formula: 'Count of cases',
        disaggregation: ['Country'],
        mov: 'CFM log',
        tier: [1, 2]
      }
    ]
  },

  'Health': {
    activities: [
      {
        indicator: '# health awareness sessions conducted',
        definition: 'Number of community health education sessions held',
        formula: 'Count of sessions',
        disaggregation: ['Country', 'Topic'],
        mov: 'Session log, photos',
        tier: [1, 2, 3]
      },
      {
        indicator: '# health workers trained',
        definition: 'Number of community health workers completing training',
        formula: 'Count of participants',
        disaggregation: ['Gender', 'Country'],
        mov: 'Training attendance sheet',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# beneficiaries receiving health services',
        definition: 'Total individuals served through health interventions',
        formula: 'Count of beneficiaries',
        disaggregation: ['Gender', 'Age', 'Country'],
        mov: 'Service delivery register',
        tier: [1, 2, 3]
      }
    ],
    outcomes: [
      {
        indicator: '% beneficiaries reporting improved health knowledge',
        definition: '(With improved knowledge ÷ surveyed) × 100',
        formula: '(Improved / Surveyed) * 100',
        disaggregation: ['Gender', 'Age group'],
        mov: 'Knowledge assessment',
        tier: [1, 2]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per beneficiary served',
        definition: 'Total health programme cost ÷ beneficiaries',
        formula: 'TotalCost / Beneficiaries',
        disaggregation: ['Country'],
        mov: 'Finance records',
        tier: [1, 2]
      }
    ],
    accountability: [
      {
        indicator: '% feedback cases resolved',
        definition: '(Resolved ÷ received) × 100',
        formula: '(Resolved / Received) * 100',
        disaggregation: ['Country'],
        mov: 'CFM register',
        tier: [1]
      }
    ]
  }
};

/**
 * Cross-cutting MEAL indicators (apply to all programmes)
 */
export const CROSS_CUTTING_INDICATORS = {
  dataQuality: {
    indicator: '% records verified against source',
    definition: '(Verified ÷ total) × 100',
    formula: '(Verified / Total) * 100',
    mov: 'DQA checklist'
  },
  accountability: {
    indicator: '# feedback cases received and resolved',
    definition: 'Totals by type (complaint/suggestion/praise)',
    formula: 'Count by type',
    mov: 'CFM register'
  },
  safeguarding: {
    indicator: '# safeguarding incidents reported and addressed',
    definition: 'Per safeguarding SOP',
    formula: 'Count of incidents',
    mov: 'Safeguarding log'
  },
  learning: {
    indicator: '# projects with documented lessons learned',
    definition: 'Count per reporting cycle',
    formula: 'Count of projects',
    mov: 'Lessons-learned template'
  },
  vfm: {
    indicator: 'VfM score (Economy, Efficiency, Effectiveness, Equity)',
    definition: 'Scored 1–5 each',
    formula: 'Average of 4 dimensions',
    mov: 'VfM checklist'
  }
};

/**
 * Get indicators for a specific programme area and tier
 * @param {string} programmeArea - Programme area name
 * @param {number} tier - Project tier (1, 2, or 3)
 * @param {string} type - Indicator type (all, activities, outputs, outcomes, etc.)
 * @returns {Array} - Filtered indicators
 */
export const getIndicatorsForProgramme = (programmeArea, tier = 1, type = 'all') => {
  const programme = STANDARD_INDICATORS[programmeArea];
  if (!programme) return [];

  if (type === 'all') {
    const allIndicators = [];
    Object.keys(programme).forEach(category => {
      const indicators = programme[category].filter(ind => ind.tier.includes(tier));
      allIndicators.push(...indicators.map(ind => ({ ...ind, category })));
    });
    return allIndicators;
  }

  const categoryIndicators = programme[type] || [];
  return categoryIndicators.filter(ind => ind.tier.includes(tier));
};

/**
 * Get all programme areas
 * @returns {Array} - List of programme area names
 */
export const getProgrammeAreas = () => {
  return Object.keys(STANDARD_INDICATORS);
};

/**
 * Get indicator categories for a programme
 * @param {string} programmeArea - Programme area name
 * @returns {Array} - List of category names
 */
export const getIndicatorCategories = (programmeArea) => {
  const programme = STANDARD_INDICATORS[programmeArea];
  if (!programme) return [];
  return Object.keys(programme);
};

export default {
  STANDARD_INDICATORS,
  CROSS_CUTTING_INDICATORS,
  getIndicatorsForProgramme,
  getProgrammeAreas,
  getIndicatorCategories
};
