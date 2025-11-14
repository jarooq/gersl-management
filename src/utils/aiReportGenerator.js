/**
 * AI Report Generator
 * Uses AI to generate professional report content
 */

import { generateSectionPrompt } from './reportTemplates';

/**
 * Load AI settings from localStorage
 * @returns {Object} AI settings
 */
const loadAISettings = () => {
  try {
    const stored = localStorage.getItem('gersl_ai_settings');
    return stored ? JSON.parse(stored) : { provider: 'template' };
  } catch (error) {
    console.error('Error loading AI settings:', error);
    return { provider: 'template' };
  }
};

/**
 * Call OpenAI API
 * @param {string} prompt - Generation prompt
 * @param {Object} settings - AI settings
 * @returns {Promise<string>} Generated content
 */
const callOpenAI = async (prompt, settings) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: settings.openaiModel || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional report writer for international development organizations. Generate clear, professional content based on the provided data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: settings.temperature || 0.7,
      max_tokens: settings.maxTokens || 2000,
      top_p: settings.topP || 1,
      frequency_penalty: settings.frequencyPenalty || 0,
      presence_penalty: settings.presencePenalty || 0
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Call Claude API
 * @param {string} prompt - Generation prompt
 * @param {Object} settings - AI settings
 * @returns {Promise<string>} Generated content
 */
const callClaude = async (prompt, settings) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: settings.claudeModel || 'claude-3-opus-20240229',
      max_tokens: settings.maxTokens || 2000,
      temperature: settings.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: `You are a professional report writer for international development organizations. Generate clear, professional content based on the provided data.\n\n${prompt}`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
};

/**
 * Call Custom API endpoint
 * @param {string} prompt - Generation prompt
 * @param {Object} settings - AI settings
 * @returns {Promise<string>} Generated content
 */
const callCustomAPI = async (prompt, settings) => {
  const response = await fetch(settings.customEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.customApiKey}`
    },
    body: JSON.stringify({
      prompt,
      model: settings.customModel,
      max_tokens: settings.maxTokens || 2000,
      temperature: settings.temperature || 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Custom API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content || data.text || data.response || data.choices?.[0]?.message?.content || '';
};

/**
 * Generate report section using AI
 * @param {Object} params - Generation parameters
 * @param {Object} params.project - Project data
 * @param {Object} params.proposal - Proposal data (optional)
 * @param {string} params.reportType - Report type
 * @param {string} params.sectionId - Section ID
 * @param {Object} params.additionalData - Additional context
 * @param {Function} params.aiProvider - AI provider function (optional)
 * @returns {Promise<string>} Generated content
 */
export const generateReportSection = async ({
  project,
  proposal,
  reportType,
  sectionId,
  additionalData = {},
  aiProvider = null
}) => {
  const prompt = generateSectionPrompt(
    project,
    proposal,
    reportType,
    sectionId,
    additionalData
  );

  if (!prompt) {
    throw new Error('Invalid report type or section ID');
  }

  // If AI provider function is provided, use it
  if (aiProvider && typeof aiProvider === 'function') {
    try {
      const content = await aiProvider(prompt);
      return content;
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate content with AI provider');
    }
  }

  // Load AI settings from localStorage
  const settings = loadAISettings();

  // Try primary AI provider
  if (settings.provider !== 'template') {
    try {
      let content = '';

      switch (settings.provider) {
        case 'openai':
          if (!settings.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
          }
          content = await callOpenAI(prompt, settings);
          break;

        case 'claude':
          if (!settings.claudeApiKey) {
            throw new Error('Claude API key not configured');
          }
          content = await callClaude(prompt, settings);
          break;

        case 'custom':
          if (!settings.customEndpoint || !settings.customApiKey) {
            throw new Error('Custom API endpoint or key not configured');
          }
          content = await callCustomAPI(prompt, settings);
          break;

        default:
          throw new Error(`Unknown AI provider: ${settings.provider}`);
      }

      if (content) {
        return content;
      }
    } catch (error) {
      console.error(`${settings.provider} AI generation error:`, error);

      // Try fallback if enabled
      if (settings.enableFallback && settings.fallbackProvider !== settings.provider) {
        console.log(`Attempting fallback to ${settings.fallbackProvider}...`);

        try {
          if (settings.fallbackProvider === 'template') {
            return generateTemplateContent(project, proposal, reportType, sectionId, additionalData);
          } else if (settings.fallbackProvider === 'openai' && settings.openaiApiKey) {
            return await callOpenAI(prompt, settings);
          } else if (settings.fallbackProvider === 'claude' && settings.claudeApiKey) {
            return await callClaude(prompt, settings);
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }

      // If fallback failed or not enabled, throw error
      throw error;
    }
  }

  // Default: Generate template-based content
  return generateTemplateContent(project, proposal, reportType, sectionId, additionalData);
};

/**
 * Generate template-based content (fallback when AI is not available)
 * @param {Object} project - Project data
 * @param {Object} proposal - Proposal data
 * @param {string} reportType - Report type
 * @param {string} sectionId - Section ID
 * @param {Object} additionalData - Additional context
 * @returns {string} Generated content
 */
const generateTemplateContent = (project, proposal, reportType, sectionId, additionalData) => {
  const data = {
    projectName: project?.name || 'Project',
    donor: project?.donor || proposal?.donor || 'N/A',
    budget: project?.budget || proposal?.budgetRequested || 0,
    spent: project?.spent || 0,
    remaining: (project?.budget || 0) - (project?.spent || 0),
    targetBeneficiaries: project?.targetBeneficiaries || proposal?.targetBeneficiaries || 0,
    actualBeneficiaries: project?.beneficiaries || 0,
    progress: project?.progress || 0,
    completedTasks: project?.tasks?.filter(t => t.status === 'Completed')?.length || 0,
    totalTasks: project?.tasks?.length || 0,
    ...additionalData
  };

  // Template-based content generation for different sections
  const templates = {
    executive_summary: `This report provides an overview of the ${data.projectName} project implementation. The project, funded by ${data.donor}, has reached ${data.actualBeneficiaries} beneficiaries against a target of ${data.targetBeneficiaries}, representing ${data.targetBeneficiaries > 0 ? Math.round((data.actualBeneficiaries / data.targetBeneficiaries) * 100) : 0}% achievement. Overall project progress stands at ${data.progress}%, with ${data.completedTasks} of ${data.totalTasks} planned activities completed. Budget utilization is at ${data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0}%, with $${data.spent.toLocaleString()} spent of the total $${data.budget.toLocaleString()} budget.`,

    project_overview: `${data.projectName} is a ${data.programmeArea || 'development'} initiative funded by ${data.donor}. The project aims to serve ${data.targetBeneficiaries} beneficiaries in ${data.location || 'the target area'}. Implementation began on ${project?.startDate || 'N/A'} and is scheduled for completion on ${project?.endDate || 'N/A'}. The total project budget is $${data.budget.toLocaleString()}, with activities focusing on achieving sustainable impact in the target communities.`,

    activities_implemented: `During the reporting period, ${data.completedTasks} activities were successfully completed. Key activities included project planning, beneficiary mobilization, and service delivery. The project team maintained regular coordination with stakeholders and ensured quality implementation of all activities. Progress tracking indicates ${data.progress}% completion of the overall project plan.`,

    beneficiary_data: `The project has reached ${data.actualBeneficiaries} beneficiaries to date, against a target of ${data.targetBeneficiaries}. This represents ${data.targetBeneficiaries > 0 ? Math.round((data.actualBeneficiaries / data.targetBeneficiaries) * 100) : 0}% of the planned reach. Beneficiaries include direct participants in project activities and indirect beneficiaries from the wider community. The project continues to track beneficiary data to ensure targets are met by project completion.`,

    financial_summary: `Total project budget: $${data.budget.toLocaleString()}\nAmount spent: $${data.spent.toLocaleString()}\nRemaining budget: $${data.remaining.toLocaleString()}\nUtilization rate: ${data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0}%\n\nFunds have been utilized in accordance with the approved budget, with regular financial monitoring ensuring proper accountability and transparency.`,

    challenges: `The project has faced some challenges during implementation, including logistical constraints and coordination needs. However, the team has employed effective mitigation strategies to address these issues. Regular stakeholder meetings and adaptive management approaches have helped maintain project momentum despite challenges.`,

    lessons_learned: `Key lessons from project implementation include the importance of community engagement, adaptive management, and strong stakeholder coordination. These learnings will inform future project planning and implementation approaches.`,

    next_steps: `For the next reporting period, the project will focus on completing remaining activities, consolidating achievements, and preparing for sustainability. Key priorities include beneficiary follow-up, documentation, and knowledge sharing.`,

    progress_summary: `Project is ${data.progress}% complete with ${data.completedTasks} of ${data.totalTasks} activities completed. Overall progress is ${data.progress >= 75 ? 'on track' : data.progress >= 50 ? 'satisfactory' : 'requires attention'}.`,

    budget_status: `Current budget utilization: ${data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0}% ($${data.spent.toLocaleString()} of $${data.budget.toLocaleString()})`,

    impact_assessment: `The project has made significant impact in the target communities, reaching ${data.actualBeneficiaries} beneficiaries with quality services and support. Sustainability measures are in place to ensure lasting benefits.`
  };

  return templates[sectionId] || `[Content for ${sectionId} section - Please edit this section with specific details about your project.]`;
};

/**
 * Generate complete report with all sections
 * @param {Object} params - Generation parameters
 * @returns {Promise<Object>} Generated report with all sections
 */
export const generateCompleteReport = async ({
  project,
  proposal,
  reportType,
  sections,
  additionalData = {},
  aiProvider = null,
  onProgress = null
}) => {
  const generatedSections = [];
  const totalSections = sections.length;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalSections,
        sectionTitle: section.title,
        percentage: Math.round(((i + 1) / totalSections) * 100)
      });
    }

    try {
      const content = await generateReportSection({
        project,
        proposal,
        reportType,
        sectionId: section.id,
        additionalData,
        aiProvider
      });

      generatedSections.push({
        id: section.id,
        title: section.title,
        content,
        generatedAt: new Date().toISOString()
      });

      // Small delay to avoid rate limiting
      if (aiProvider) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error generating section ${section.id}:`, error);
      generatedSections.push({
        id: section.id,
        title: section.title,
        content: `[Error generating content: ${error.message}. Please edit manually.]`,
        error: true,
        generatedAt: new Date().toISOString()
      });
    }
  }

  return {
    sections: generatedSections,
    metadata: {
      reportType,
      projectName: project?.name || 'Project',
      donor: project?.donor || proposal?.donor,
      generatedDate: new Date().toISOString(),
      totalSections: generatedSections.length,
      successfulSections: generatedSections.filter(s => !s.error).length
    }
  };
};

/**
 * Configure AI provider
 * This can be called to set up the AI service
 */
export const configureAI = (config) => {
  if (!window.GERSL_CONFIG) {
    window.GERSL_CONFIG = {};
  }

  if (config.apiEndpoint) {
    window.GERSL_CONFIG.AI_API_ENDPOINT = config.apiEndpoint;
  }

  if (config.apiKey) {
    window.GERSL_CONFIG.AI_API_KEY = config.apiKey;
  }

  console.log('✅ AI configuration updated');
};

/**
 * Check if AI is available
 * @returns {boolean} Whether AI generation is available
 */
export const isAIAvailable = () => {
  return !!(window.GERSL_CONFIG?.AI_API_ENDPOINT || window.GERSL_CONFIG?.AI_PROVIDER);
};

export default {
  generateReportSection,
  generateCompleteReport,
  configureAI,
  isAIAvailable
};
