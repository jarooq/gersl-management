/**
 * AI Service for Proposal Generation using Groq AI
 *
 * Groq provides free, fast access to Llama and other models
 * More reliable than Gemini for structured JSON output
 */

const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Enhanced proposal template for comprehensive content generation
 */
const PROPOSAL_TEMPLATE = `Generate a GER-compliant humanitarian proposal for Sri Lanka.

USER IDEA: {userIdea}

IMPORTANT: Write detailed, professional content for key narrative sections (aim for 200-300 words each):
- summary: Detailed project overview covering context, beneficiaries, activities, outcomes, and impact
- problemStatement: In-depth problem analysis with situation, root causes, affected populations, gaps, and evidence
- proposedSolution: Comprehensive solution with approach, strategies, phases, engagement, and sustainability
- overallGoal: Detailed goal with vision, expected changes, benefits, standards alignment, and indicators

Return ONLY valid JSON with this structure:
{
  "title": "Project title",
  "programmeArea": "Education|Health|WASH|Protection|Livelihoods|Emergency Response|Orphans Care|Seasonal Projects|Infrastructure|General Projects",
  "donor": "Donor name",
  "district": "Sri Lankan district",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budgetRequested": 50000,
  "targetBeneficiaries": 500,
  "summary": "Write a detailed 3-4 paragraph project summary covering: (1) project context and target beneficiaries in Sri Lanka, (2) main activities and implementation approach, (3) expected outcomes and overall community impact. Be specific and professional.",
  "projectTier": "Tier 1|Tier 2|Tier 3",
  "sectorTheme": "Sector",
  "problemStatement": "Write a detailed 3-4 paragraph problem analysis covering: (1) current situation and root causes in Sri Lankan context, (2) affected populations and existing service gaps, (3) evidence/data supporting need for intervention, (4) urgency and why action is needed now.",
  "proposedSolution": "Write a detailed 3-4 paragraph solution description covering: (1) overall approach and methodology, (2) key intervention strategies and activities, (3) implementation phases and timeline, (4) community engagement and sustainability measures.",
  "overallGoal": "Write a detailed 3-4 paragraph goal statement covering: (1) long-term vision and specific changes expected, (2) target population benefits and improved wellbeing, (3) alignment with humanitarian standards and development goals, (4) measurable success indicators and impact metrics.",
  "strategicAlignment": "Strategy alignment description",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "keyActivities": ["Activity 1", "Activity 2", "Activity 3"],
  "resultsFramework": [
    {
      "indicator": "Indicator",
      "baseline": "Current",
      "target": "Target",
      "meansOfVerification": "How measured",
      "frequency": "Monthly"
    }
  ],
  "beneficiaryBreakdown": {
    "directMale": 200,
    "directFemale": 200,
    "directChildren": 100,
    "directPWD": 50,
    "indirectTotal": 1000
  },
  "theoryOfChange": {
    "inputs": ["Input 1", "Input 2"],
    "activities": ["Activity 1", "Activity 2"],
    "outputs": ["Output 1", "Output 2"],
    "outcomes": ["Outcome 1", "Outcome 2"],
    "impact": "Long-term impact statement",
    "assumptions": ["Assumption 1", "Assumption 2"],
    "risks": ["Risk 1", "Risk 2"]
  },
  "budgetBreakdown": [
    {
      "category": "Personnel",
      "description": "Staff",
      "cost": 20000,
      "justification": "Why needed"
    }
  ],
  "safeguarding": {
    "dataProtection": true,
    "informedConsent": true,
    "childSafeguarding": true,
    "incidentReporting": true,
    "backgroundChecks": true,
    "codeOfConduct": true,
    "safeguardingFocalPerson": "Project Manager",
    "cfmChannels": ["Hotline", "Suggestion Box"]
  }
}`;

/**
 * Generate proposal using Groq AI (Llama 3)
 */
export const generateProposalFromIdea = async (userIdea) => {
  // Use Groq API key or fall back to Gemini
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('AI service not configured. Please set GROQ_API_KEY or GEMINI_API_KEY');
  }

  try {
    const prompt = PROPOSAL_TEMPLATE.replace('{userIdea}', userIdea);

    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert humanitarian proposal writer specializing in GER-compliant proposals. Write detailed, professional content. Return ONLY valid JSON, no markdown, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Groq API Error:', errorData);

      // If JSON validation failed, try to fix and use the failed_generation
      if (errorData.error?.code === 'json_validate_failed' && errorData.error?.failed_generation) {
        console.log('⚠️ Groq JSON validation failed, attempting to fix failed_generation...');
        const generatedText = errorData.error.failed_generation;

        const data = {
          choices: [{
            message: {
              content: generatedText
            }
          }]
        };

        return processGroqResponse(data);
      }

      throw new Error(`Groq AI failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return processGroqResponse(data);
  } catch (error) {
    console.error('Groq AI Service Error:', error);
    throw error;
  }
};

/**
 * Process Groq API response and clean JSON
 */
function processGroqResponse(data) {
  const generatedText = data.choices?.[0]?.message?.content;

  if (!generatedText) {
    throw new Error('No response from Groq AI');
  }

  // Clean and parse JSON
  let jsonText = generatedText.trim();

  // Remove markdown code blocks if present
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  // Extract JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  // Fix common JSON syntax errors
  jsonText = jsonText.replace(/("risks":\s*\[[\s\S]*?\])\s*\]\s*,\s*("budgetBreakdown":)/g, '$1\n  },\n  $2');

  const proposalData = JSON.parse(jsonText);

  if (!proposalData.title || !proposalData.programmeArea) {
    throw new Error('Generated proposal missing required fields');
  }

  return proposalData;
}

/**
 * ==========================================
 * HR DOCUMENT GENERATION FUNCTIONS
 * ==========================================
 */

/**
 * Generate a job description using AI
 */
export const generateJobDescription = async (jobDetails) => {
  const { position, department, level, responsibilities, qualifications } = jobDetails;
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('AI service not configured. Please set GROQ_API_KEY');
  }

  const prompt = `Generate a professional job description for the following position in Sri Lanka:

Position: ${position}
Department: ${department}
Level: ${level || 'Mid-Level'}

${responsibilities ? `Key Responsibilities:\n${responsibilities}` : ''}
${qualifications ? `Required Qualifications:\n${qualifications}` : ''}

Please create a comprehensive job description that includes:
1. Position Overview
2. Key Responsibilities (5-7 bullet points)
3. Required Qualifications and Skills
4. Preferred Qualifications
5. Working Conditions

Format it professionally and make it suitable for posting on job boards in Sri Lanka.`;

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional specializing in job descriptions. Write clear, professional content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`AI failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Job Description Generation Error:', error);
    throw error;
  }
};

/**
 * Generate an employment agreement compliant with Sri Lankan Labour Law
 */
export const generateEmploymentAgreement = async (employmentDetails) => {
  const {
    staffName,
    position,
    department,
    salary,
    employmentType,
    startDate,
    contractDuration,
    probationPeriod = 3,
    workingHours = 8,
    workingDays = 5,
    organizationName = 'Global Ehsan Relief (Pvt) Ltd',
    organizationAddress = 'Sri Lanka'
  } = employmentDetails;

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('AI service not configured. Please set GROQ_API_KEY');
  }

  const prompt = `Generate a comprehensive employment agreement for a private sector employee in Sri Lanka, compliant with Sri Lankan Labour Law.

EMPLOYEE DETAILS:
- Name: ${staffName}
- Position: ${position}
- Department: ${department}
- Employment Type: ${employmentType}
- Basic Salary: LKR ${salary} per month
- Start Date: ${startDate}
${contractDuration ? `- Contract Duration: ${contractDuration} months` : ''}
- Probation Period: ${probationPeriod} months
- Working Hours: ${workingHours} hours per day
- Working Days: ${workingDays} days per week

ORGANIZATION:
- Name: ${organizationName}
- Address: ${organizationAddress}

MANDATORY REQUIREMENTS (Sri Lankan Labour Law - Private Sector):

1. LEAVE ENTITLEMENTS:
   - Annual Leave: 14 days per year (after completing 1 year of service)
   - Casual Leave: 7 days per year
   - Sick Leave: 7 days per year
   - Maternity Leave: 84 days (12 weeks) for female employees
   - Public Holidays: As per Sri Lankan Government declarations

2. EPF/ETF CONTRIBUTIONS:
   - Employee EPF Contribution: 8% of basic salary
   - Employer EPF Contribution: 12% of basic salary
   - Employer ETF Contribution: 3% of basic salary

3. NOTICE PERIODS:
   - Probation Period: 2 weeks notice by either party
   - After Probation: ${employmentType === 'Contract' ? '1 month notice or as per contract end date' : '2 months notice by either party'}

4. TERMINATION CLAUSES:
   - Grounds for termination
   - Notice requirements
   - Final settlement procedures

5. GRATUITY:
   - Payable after 5 years of continuous service
   - Calculation: (Last drawn salary × years of service) / 2

6. WORKING HOURS & OVERTIME:
   - Normal working hours: ${workingHours} hours per day
   - Overtime rates as per Sri Lankan labour regulations
   - Rest days and public holiday work compensation

7. CONFIDENTIALITY & NON-DISCLOSURE

8. CODE OF CONDUCT & DISCIPLINARY PROCEDURES

9. PROBATION REVIEW PROCESS

${contractDuration ? `10. CONTRACT RENEWAL TERMS:
   - Contract expires after ${contractDuration} months
   - Renewal subject to performance and mutual agreement
   - Notice for non-renewal: 1 month before expiry` : ''}

Please generate a formal, legally sound employment agreement in professional language that includes all these clauses with proper legal formatting. Use numbered sections and subsections for clarity.`;

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal advisor specializing in Sri Lankan employment law. Write formal, legally sound documents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`AI failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Employment Agreement Generation Error:', error);
    throw error;
  }
};

/**
 * Generate a contract renewal letter
 */
export const generateContractRenewal = async (renewalDetails) => {
  const {
    staffName,
    position,
    currentContractEndDate,
    newContractDuration,
    newSalary,
    performanceHighlights
  } = renewalDetails;

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('AI service not configured. Please set GROQ_API_KEY');
  }

  const prompt = `Generate a professional contract renewal letter for an employee in Sri Lanka.

DETAILS:
- Employee Name: ${staffName}
- Position: ${position}
- Current Contract End Date: ${currentContractEndDate}
- New Contract Duration: ${newContractDuration} months
- New Salary: LKR ${newSalary} per month
${performanceHighlights ? `- Performance Highlights: ${performanceHighlights}` : ''}

The letter should:
1. Express appreciation for the employee's contributions
2. Confirm the contract renewal terms
3. State the new salary (if changed)
4. Outline the new contract period
5. Include standard employment terms reference
6. Request confirmation of acceptance
7. Be formal and professional

Format as a business letter with proper structure.`;

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional. Write formal, professional business correspondence.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.6,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`AI failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Contract Renewal Generation Error:', error);
    throw error;
  }
};

/**
 * Generate a termination letter
 */
export const generateTerminationLetter = async (terminationDetails) => {
  const {
    staffName,
    position,
    terminationDate,
    reason,
    noticePeriod,
    finalWorkingDay,
    gratuityPayable = false,
    leaveEncashment = 0
  } = terminationDetails;

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('AI service not configured. Please set GROQ_API_KEY');
  }

  const prompt = `Generate a professional termination letter compliant with Sri Lankan Labour Law.

DETAILS:
- Employee Name: ${staffName}
- Position: ${position}
- Termination Date: ${terminationDate}
- Reason: ${reason}
- Notice Period: ${noticePeriod}
- Final Working Day: ${finalWorkingDay}
- Gratuity Payable: ${gratuityPayable ? 'Yes' : 'No'}
- Leave Encashment: ${leaveEncashment} days

The letter should:
1. Clearly state the termination decision
2. Provide the reason (if applicable)
3. Outline the notice period served
4. Detail final settlement components (salary, leave encashment, gratuity)
5. Mention return of company property
6. Include EPF/ETF final contribution details
7. Maintain a respectful and professional tone
8. Be legally compliant with Sri Lankan labour regulations

Format as a formal business letter.`;

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal advisor specializing in Sri Lankan employment law. Write formal, legally sound documents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`AI failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Termination Letter Generation Error:', error);
    throw error;
  }
};

/**
 * Generate a resignation acceptance letter
 */
export const generateResignationAcceptance = async (resignationDetails) => {
  const {
    staffName,
    position,
    resignationDate,
    noticeRequirement,
    finalWorkingDay,
    acknowledgment
  } = resignationDetails;

  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('AI service not configured. Please set GROQ_API_KEY');
  }

  const prompt = `Generate a professional resignation acceptance letter for Sri Lanka.

DETAILS:
- Employee Name: ${staffName}
- Position: ${position}
- Resignation Received: ${resignationDate}
- Notice Requirement: ${noticeRequirement}
- Final Working Day: ${finalWorkingDay}
${acknowledgment ? `- Special Acknowledgment: ${acknowledgment}` : ''}

The letter should:
1. Acknowledge receipt of resignation
2. Accept the resignation formally
3. Confirm notice period and final working day
4. Express appreciation for service
5. Outline exit procedures (handover, clearance, final settlement)
6. Wish them well for future endeavors
7. Maintain a positive and professional tone

Format as a formal business letter.`;

  try {
    const response = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional. Write formal, professional business correspondence.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.6,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`AI failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Resignation Acceptance Generation Error:', error);
    throw error;
  }
};

export default {
  generateProposalFromIdea,
  generateJobDescription,
  generateEmploymentAgreement,
  generateContractRenewal,
  generateTerminationLetter,
  generateResignationAcceptance
};
