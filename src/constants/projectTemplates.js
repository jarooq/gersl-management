// Project Milestone Templates

export const MILESTONE_TEMPLATES = {
  standard: () => [
    { id: 1, name: 'Project inception and setup', status: 'Pending', date: '' },
    { id: 2, name: 'Baseline survey completed', status: 'Pending', date: '' },
    { id: 3, name: 'Mid-term review', status: 'Pending', date: '' },
    { id: 4, name: 'Final evaluation', status: 'Pending', date: '' }
  ],

  education: () => [
    { id: 1, name: 'Needs assessment completed', status: 'Pending', date: '' },
    { id: 2, name: 'Curriculum development', status: 'Pending', date: '' },
    { id: 3, name: 'Teacher training completed', status: 'Pending', date: '' },
    { id: 4, name: 'Student enrollment completed', status: 'Pending', date: '' },
    { id: 5, name: 'Mid-term assessments', status: 'Pending', date: '' },
    { id: 6, name: 'Final evaluation and reporting', status: 'Pending', date: '' }
  ],

  health: () => [
    { id: 1, name: 'Community health assessment', status: 'Pending', date: '' },
    { id: 2, name: 'Medical supplies procurement', status: 'Pending', date: '' },
    { id: 3, name: 'Health worker training', status: 'Pending', date: '' },
    { id: 4, name: 'First health campaign', status: 'Pending', date: '' },
    { id: 5, name: 'Impact assessment', status: 'Pending', date: '' },
    { id: 6, name: 'Final report and handover', status: 'Pending', date: '' }
  ],

  infrastructure: () => [
    { id: 1, name: 'Site assessment and planning', status: 'Pending', date: '' },
    { id: 2, name: 'Design approval', status: 'Pending', date: '' },
    { id: 3, name: 'Foundation work completed', status: 'Pending', date: '' },
    { id: 4, name: 'Structure completion', status: 'Pending', date: '' },
    { id: 5, name: 'Quality inspection', status: 'Pending', date: '' },
    { id: 6, name: 'Handover and inauguration', status: 'Pending', date: '' }
  ],

  livelihood: () => [
    { id: 1, name: 'Beneficiary selection', status: 'Pending', date: '' },
    { id: 2, name: 'Skills training phase 1', status: 'Pending', date: '' },
    { id: 3, name: 'Resource distribution', status: 'Pending', date: '' },
    { id: 4, name: 'Business plan development', status: 'Pending', date: '' },
    { id: 5, name: 'Income generation started', status: 'Pending', date: '' },
    { id: 6, name: 'Sustainability assessment', status: 'Pending', date: '' }
  ],

  emergency: () => [
    { id: 1, name: 'Rapid needs assessment', status: 'Pending', date: '' },
    { id: 2, name: 'Emergency supplies distributed', status: 'Pending', date: '' },
    { id: 3, name: 'Temporary shelter established', status: 'Pending', date: '' },
    { id: 4, name: 'Medical assistance provided', status: 'Pending', date: '' },
    { id: 5, name: 'Recovery plan initiated', status: 'Pending', date: '' }
  ]
};

// Helper function to generate initial milestones based on project type
export const generateInitialMilestones = (projectType = 'standard', duration = 12) => {
  const template = MILESTONE_TEMPLATES[projectType] || MILESTONE_TEMPLATES.standard;
  return template(duration);
};

// Get all available project types
export const getProjectTypes = () => Object.keys(MILESTONE_TEMPLATES);
