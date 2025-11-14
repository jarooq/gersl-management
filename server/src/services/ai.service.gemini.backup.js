/**
 * AI Service for Proposal Generation
 *
 * Backend service that handles all AI operations using Google Gemini API.
 * API key is stored securely in server environment variables.
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Proposal template context for AI
 */
const PROPOSAL_TEMPLATE_CONTEXT = `
Generate GER-compliant humanitarian proposals for Sri Lanka.

REQUIRED SECTIONS:
1. Basic Info: Title, Programme Area (Education/Health/WASH/Protection/Livelihoods/Emergency), Donor, District, Dates, Budget, Beneficiaries
2. GER Fields: Project Tier (T1:<$50k, T2:$50k-$250k, T3:>$250k), Problem, Solution, Goal, Strategy
3. Objectives (3-5 SMART) & Activities
4. MEAL: Results Framework, Beneficiary Breakdown (directMale/Female/Children/PWD, indirectTotal)
5. Theory of Change: Inputs, Activities, Outputs, Outcomes, Impact, Assumptions, Risks
6. Budget: 4-6 categories (Personnel, Equipment, Training, Logistics, Monitoring, Other)
7. Safeguarding: All checkboxes true, focal person, CFM channels

RULES: Be concise, specific, realistic, measurable. Sri Lankan context.
`;

/**
 * Generate proposal from user's idea
 */
export const generateProposalFromIdea = async (userIdea) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in server environment variables.');
  }

  const prompt = `${PROPOSAL_TEMPLATE_CONTEXT}

USER'S PROJECT IDEA:
${userIdea}

TASK: Generate a complete, GER-compliant humanitarian proposal based on this idea.

CRITICAL RULES:
1. Return ONLY valid JSON
2. Keep ALL text concise (max 150 chars per field)
3. Use 3-5 items for arrays (objectives, activities, etc.)
4. Keep budget breakdown to 4-6 categories max
5. Be specific but brief

RESPONSE FORMAT: Return a valid JSON object with this exact structure:
{
  "title": "Project Title",
  "programmeArea": "Education|Health|WASH|Protection|Livelihoods|Emergency Response",
  "donor": "Suggested donor name",
  "district": "Sri Lankan district",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budgetRequested": 50000,
  "targetBeneficiaries": 1000,
  "summary": "Brief summary (2-3 sentences)",
  "projectTier": "Tier 1|Tier 2|Tier 3",
  "sectorTheme": "Sector name",
  "problemStatement": "Clear problem description",
  "proposedSolution": "How project solves the problem",
  "overallGoal": "Long-term impact goal",
  "strategicAlignment": "How it aligns with strategy",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "keyActivities": ["Activity 1", "Activity 2", "Activity 3"],
  "resultsFramework": [
    {
      "indicator": "Indicator name",
      "baseline": "Current value",
      "target": "Target value",
      "meansOfVerification": "How to measure",
      "frequency": "Monthly|Quarterly|Annually"
    }
  ],
  "beneficiaryBreakdown": {
    "directMale": 300,
    "directFemale": 400,
    "directChildren": 250,
    "directPWD": 50,
    "indirectTotal": 2000
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
      "category": "Personnel|Equipment|Training|Logistics|Monitoring|Other",
      "description": "Description",
      "cost": 10000,
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
    "safeguardingFocalPerson": "Role/Name",
    "cfmChannels": ["Hotline", "Suggestion Box", "Community Meetings"]
  }
}

Generate a realistic, complete proposal. Be specific to Sri Lanka context.`;

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              programmeArea: { type: 'string' },
              donor: { type: 'string' },
              district: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              budgetRequested: { type: 'number' },
              targetBeneficiaries: { type: 'number' },
              summary: { type: 'string' },
              projectTier: { type: 'string' },
              sectorTheme: { type: 'string' },
              problemStatement: { type: 'string' },
              proposedSolution: { type: 'string' },
              overallGoal: { type: 'string' },
              strategicAlignment: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              keyActivities: { type: 'array', items: { type: 'string' } },
              resultsFramework: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicator: { type: 'string' },
                    baseline: { type: 'string' },
                    target: { type: 'string' },
                    meansOfVerification: { type: 'string' },
                    frequency: { type: 'string' }
                  }
                }
              },
              beneficiaryBreakdown: {
                type: 'object',
                properties: {
                  directMale: { type: 'number' },
                  directFemale: { type: 'number' },
                  directChildren: { type: 'number' },
                  directPWD: { type: 'number' },
                  indirectTotal: { type: 'number' }
                }
              },
              theoryOfChange: {
                type: 'object',
                properties: {
                  inputs: { type: 'array', items: { type: 'string' } },
                  activities: { type: 'array', items: { type: 'string' } },
                  outputs: { type: 'array', items: { type: 'string' } },
                  outcomes: { type: 'array', items: { type: 'string' } },
                  impact: { type: 'string' },
                  assumptions: { type: 'array', items: { type: 'string' } },
                  risks: { type: 'array', items: { type: 'string' } }
                }
              },
              budgetBreakdown: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    description: { type: 'string' },
                    cost: { type: 'number' },
                    justification: { type: 'string' }
                  }
                }
              },
              safeguarding: {
                type: 'object',
                properties: {
                  dataProtection: { type: 'boolean' },
                  informedConsent: { type: 'boolean' },
                  childSafeguarding: { type: 'boolean' },
                  incidentReporting: { type: 'boolean' },
                  backgroundChecks: { type: 'boolean' },
                  codeOfConduct: { type: 'boolean' },
                  safeguardingFocalPerson: { type: 'string' },
                  cfmChannels: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            required: ['title', 'programmeArea']
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Gemini API Error:', errorData);
      throw new Error(`AI generation failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response generated from AI');
    }

    // Parse JSON from response with robust error handling
    let jsonText = generatedText.trim();

    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Extract JSON object if there's additional text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Clean up common JSON issues more carefully
    jsonText = jsonText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\r\n/g, ' ') // Replace Windows newlines
      .replace(/\n/g, ' ') // Replace Unix newlines
      .replace(/\r/g, ' ') // Replace Mac newlines
      .replace(/\t/g, ' ') // Replace tabs
      .replace(/\\n/g, ' ') // Replace escaped newlines
      .replace(/\\t/g, ' ') // Replace escaped tabs
      .replace(/\s{2,}/g, ' ') // Normalize multiple spaces to single space (but keep single spaces)
      .replace(/,\s+}/g, '}') // Remove trailing commas before closing braces
      .replace(/,\s+]/g, ']') // Remove trailing commas before closing brackets
      .trim();

    // Fix truncated property names - detect pattern where lowercase letter follows { or , without opening quote
    // Pattern: {irectMale": or ,irectMale": should be {"directMale": or ,"directMale":
    // This is a more general fix that catches any truncated property name
    const truncatedPropertyPattern = /([{,])\s*([a-z][a-zA-Z0-9]*":\s*)/g;
    const beforeRepair = jsonText.substring(3900, 4000);

    jsonText = jsonText.replace(truncatedPropertyPattern, (match, prefix, property) => {
      // Add opening quote before the property name
      return `${prefix}"${property}`;
    });

    // Log the repair for debugging
    const afterRepair = jsonText.substring(3900, 4000);
    if (beforeRepair !== afterRepair) {
      console.log('✓ Applied truncated property name repair');
      console.log('Before:', beforeRepair);
      console.log('After:', afterRepair);
    }

    // Additional specific repairs for known problematic fields
    jsonText = jsonText
      .replace(/([{,]\s*)"?([dD])irect(Male|Female|Children|PWD)"/g, '$1"direct$3"')
      .replace(/([{,]\s*)"?([iI])ndirectTotal"/g, '$1"indirectTotal"')
      .replace(/([{,]\s*)"?([pP])rogrammeArea"/g, '$1"programmeArea"')
      .replace(/([{,]\s*)"?([pP])roposedSolution"/g, '$1"proposedSolution"')
      .replace(/([{,]\s*)"?([oO])verallGoal"/g, '$1"overallGoal"')
      .replace(/([{,]\s*)"?([pP])rojectTier"/g, '$1"projectTier"');

    let proposalData;
    try {
      proposalData = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parsing fails, log the problematic JSON for debugging
      console.error('JSON Parse Error:', parseError.message);
      console.error('Problematic JSON snippet:', jsonText.substring(Math.max(0, parseError.message.match(/\d+/)?.[0] - 100), parseError.message.match(/\d+/)?.[0] + 100));
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    if (!proposalData.title || !proposalData.programmeArea) {
      throw new Error('Generated proposal missing required fields');
    }

    return proposalData;

  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export default {
  generateProposalFromIdea
};
