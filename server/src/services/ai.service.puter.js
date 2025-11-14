/**
 * AI Service for Proposal Generation using Puter.js AI
 *
 * Puter.js provides free access to GPT-3.5-turbo and other AI models
 * More reliable and faster than Gemini for structured output
 */

const PUTER_API_ENDPOINT = 'https://api.puter.com/drivers/call';

/**
 * Simplified proposal template for faster generation
 */
const PROPOSAL_TEMPLATE = `Generate a GER-compliant humanitarian proposal for Sri Lanka.

USER IDEA: {userIdea}

Return ONLY valid JSON with this structure (keep all text under 100 chars):
{
  "title": "Project title",
  "programmeArea": "Education|Health|WASH|Protection|Livelihoods|Emergency Response",
  "donor": "Donor name",
  "district": "Sri Lankan district",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budgetRequested": 50000,
  "targetBeneficiaries": 500,
  "summary": "Brief 2-sentence summary",
  "projectTier": "Tier 1|Tier 2|Tier 3",
  "sectorTheme": "Sector",
  "problemStatement": "Problem description",
  "proposedSolution": "Solution",
  "overallGoal": "Goal",
  "strategicAlignment": "Strategy",
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
    "impact": "Long-term impact",
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
 * Generate proposal using Puter AI (GPT-3.5-turbo)
 */
export const generateProposalFromIdea = async (userIdea) => {
  const apiKey = process.env.PUTER_API_KEY || 'anonymous'; // Puter allows anonymous access

  try {
    const prompt = PROPOSAL_TEMPLATE.replace('{userIdea}', userIdea);

    const response = await fetch(PUTER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        interface: 'puter-chat-completion',
        driver: 'openai-completion',
        method: 'complete',
        args: {
          messages: [
            {
              role: 'system',
              content: 'You are a humanitarian proposal writer. Return ONLY valid JSON, no markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 2000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Puter API Error:', errorData);
      throw new Error(`Puter AI failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.result?.message?.content || data.result?.text;

    if (!generatedText) {
      throw new Error('No response from Puter AI');
    }

    // Clean and parse JSON
    let jsonText = generatedText.trim();

    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const proposalData = JSON.parse(jsonText);

    if (!proposalData.title || !proposalData.programmeArea) {
      throw new Error('Generated proposal missing required fields');
    }

    return proposalData;

  } catch (error) {
    console.error('Puter AI Service Error:', error);
    throw error;
  }
};

export default {
  generateProposalFromIdea
};
