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

        // Continue to the JSON parsing section below
        // We'll handle this by setting data.choices manually
        const data = {
          choices: [{
            message: {
              content: generatedText
            }
          }]
        };

        // Jump to JSON processing
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

  // Fix common JSON syntax errors from Groq
  // Fix theoryOfChange closing bracket (common Groq error: closes object with ] instead of })
  jsonText = jsonText.replace(/("risks":\s*\[[\s\S]*?\])\s*\]\s*,\s*("budgetBreakdown":)/g, '$1\n  },\n  $2');

  const proposalData = JSON.parse(jsonText);

  if (!proposalData.title || !proposalData.programmeArea) {
    throw new Error('Generated proposal missing required fields');
  }

  return proposalData;
}

export default {
  generateProposalFromIdea
};
