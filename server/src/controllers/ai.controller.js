import { generateProposalFromIdea } from '../services/ai.service.js';

/**
 * @route   POST /api/ai/generate-proposal
 * @desc    Generate proposal from user's idea using AI
 * @access  Private (requires authentication)
 */
export const generateProposal = async (req, res) => {
  try {
    const { idea } = req.body;

    // Validation
    if (!idea || typeof idea !== 'string' || idea.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed project idea (at least 20 characters)'
      });
    }

    // Check if API key is configured (Groq or Gemini)
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'your_groq_api_key_here') {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please contact your system administrator to set up the Groq or Gemini API key.'
      });
    }

    // Generate proposal
    const proposalData = await generateProposalFromIdea(idea);

    return res.status(200).json({
      success: true,
      message: 'Proposal generated successfully',
      data: proposalData
    });

  } catch (error) {
    console.error('Generate Proposal Error:', error);

    // Handle specific error types
    if (error.message.includes('API key')) {
      return res.status(503).json({
        success: false,
        message: 'AI service configuration error. Please contact your administrator.'
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'AI service rate limit reached. Please try again in a minute.'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate proposal. Please try again.'
    });
  }
};

/**
 * @route   GET /api/ai/status
 * @desc    Check if AI service is available and configured
 * @access  Private
 */
export const checkAIStatus = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    const isConfigured = apiKey &&
                        apiKey !== 'your_gemini_api_key_here' &&
                        apiKey !== 'your_groq_api_key_here';

    return res.status(200).json({
      success: true,
      data: {
        available: isConfigured,
        message: isConfigured
          ? 'AI service is available'
          : 'AI service not configured. Please set GROQ_API_KEY or GEMINI_API_KEY environment variable.'
      }
    });

  } catch (error) {
    console.error('Check AI Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check AI status'
    });
  }
};

export default {
  generateProposal,
  checkAIStatus
};
