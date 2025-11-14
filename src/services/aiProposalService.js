/**
 * AI Proposal Service
 *
 * This service provides AI-powered proposal generation using Google Gemini API (free tier).
 * It helps staff write GER-compliant proposals by converting their ideas into structured data.
 *
 * Features:
 * - Template-aware: Understands GERSL proposal structure
 * - Context-aware: Knows about GER standards, MEAL framework, Theory of Change
 * - Free tier: Google Gemini 1.5 Flash (15 req/min, 1M tokens/day)
 * - No external data: AI works only within system boundaries
 */

// Try the stable v1 API with gemini-pro model
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Proposal template structure for AI context
 */
const PROPOSAL_TEMPLATE_CONTEXT = `
You are an AI assistant helping staff write humanitarian project proposals following GER (Global Emergency Response) standards.

PROPOSAL STRUCTURE:
1. Basic Information:
   - Title (clear, descriptive project name)
   - Programme Area (Education, Health, WASH, Protection, Livelihoods, Emergency Response)
   - Donor (funding organization name)
   - District (Sri Lankan district)
   - Start Date and End Date
   - Budget Requested (in USD)
   - Target Beneficiaries (number)

2. GER-Compliant Fields:
   - Project Tier (Tier 1: $0-$50k, Tier 2: $50k-$250k, Tier 3: $250k+)
   - Sector/Theme (aligned with programme area)
   - Problem Statement (clear articulation of the problem)
   - Proposed Solution (how project addresses the problem)
   - Overall Goal (long-term impact)
   - Strategic Alignment (how it aligns with organizational strategy)

3. Objectives & Activities:
   - Objectives (3-5 SMART objectives)
   - Key Activities (specific activities per objective)

4. MEAL Framework:
   - Results Framework (Output → Outcome → Impact indicators)
   - Beneficiary Breakdown (Direct: Male, Female, Children, PWD; Indirect total)

5. Theory of Change:
   - Inputs (resources needed)
   - Activities (what we do)
   - Outputs (immediate results)
   - Outcomes (medium-term changes)
   - Impact (long-term goal)
   - Assumptions (what must be true for success)
   - Risks (potential challenges)

6. Budget Breakdown:
   - Categories: Personnel, Equipment, Training, Logistics, Monitoring, Other
   - Each with cost and justification

7. Safeguarding Compliance:
   - Data Protection, Informed Consent, Child Safeguarding
   - Incident Reporting, Background Checks, Code of Conduct
   - Safeguarding Focal Person
   - Community Feedback Mechanisms

IMPORTANT RULES:
- All proposals must be humanitarian/development focused
- Must align with GER standards
- Use Sri Lankan context (districts, divisions)
- Be specific and realistic
- Include measurable indicators
- Address safeguarding
- Consider sustainability
`;

/**
 * Generate AI proposal from user's idea
 * @param {string} userIdea - User's project idea/description
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} - Structured proposal data
 */
export const generateProposalFromIdea = async (userIdea, apiKey) => {
  try {
    const prompt = `${PROPOSAL_TEMPLATE_CONTEXT}

USER'S PROJECT IDEA:
${userIdea}

TASK: Generate a complete, GER-compliant humanitarian proposal based on this idea.

RESPONSE FORMAT: Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
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
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Gemini API Error Details:', errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract generated text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response generated from AI');
    }

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const proposalData = JSON.parse(jsonText);

    // Validate required fields
    if (!proposalData.title || !proposalData.programmeArea) {
      throw new Error('Generated proposal missing required fields');
    }

    return {
      success: true,
      data: proposalData
    };

  } catch (error) {
    console.error('AI Proposal Generation Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate proposal'
    };
  }
};

/**
 * Refine existing proposal with AI suggestions
 * @param {Object} currentProposal - Current proposal data
 * @param {string} refinementRequest - What to improve
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} - Refined proposal data
 */
export const refineProposal = async (currentProposal, refinementRequest, apiKey) => {
  try {
    const prompt = `${PROPOSAL_TEMPLATE_CONTEXT}

CURRENT PROPOSAL:
${JSON.stringify(currentProposal, null, 2)}

USER'S REFINEMENT REQUEST:
${refinementRequest}

TASK: Improve the proposal based on the user's request. Return ONLY the complete updated proposal as valid JSON (same structure as above).

Keep all existing good content. Only modify what the user requested.`;

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
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refine proposal');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const refinedData = JSON.parse(jsonText);

    return {
      success: true,
      data: refinedData
    };

  } catch (error) {
    console.error('AI Proposal Refinement Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to refine proposal'
    };
  }
};

/**
 * Get AI suggestions for improving a specific section
 * @param {string} section - Section name (e.g., 'problemStatement', 'objectives')
 * @param {string} currentContent - Current section content
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} - Suggestions
 */
export const getSectionSuggestions = async (section, currentContent, apiKey) => {
  try {
    const prompt = `You are helping improve a humanitarian proposal section.

SECTION: ${section}
CURRENT CONTENT: ${currentContent}

TASK: Provide 3 specific suggestions to improve this section for GER compliance and effectiveness.

Return ONLY a JSON array: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

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
          temperature: 0.8,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const suggestions = JSON.parse(jsonText);

    return {
      success: true,
      suggestions
    };

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get suggestions'
    };
  }
};

/**
 * Validate API key
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<boolean>} - Valid or not
 */
export const validateApiKey = async (apiKey) => {
  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }]
      })
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

export default {
  generateProposalFromIdea,
  refineProposal,
  getSectionSuggestions,
  validateApiKey
};
