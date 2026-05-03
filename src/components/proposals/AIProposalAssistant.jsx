import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader, CheckCircle, AlertCircle, Lightbulb, FileText } from 'lucide-react';
import API from '../../services/api';

/**
 * AI Proposal Assistant Component
 *
 * Helps staff write GER-compliant proposals using AI.
 * Features:
 * - Generate complete proposal from idea
 * - Refine existing proposals
 * - Get section-specific suggestions
 * - Template-aware generation
 */
const AIProposalAssistant = ({ isOpen, onClose, onProposalGenerated, currentProposal = null }) => {
  const [mode, setMode] = useState('generate'); // 'generate' | 'refine' | 'suggest'
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiAvailable, setAiAvailable] = useState(null);

  // Check if AI service is available
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await API.AI.checkStatus();
        setAiAvailable(response.data.available);
      } catch (err) {
        console.error('Failed to check AI status:', err);
        setAiAvailable(false);
      }
    };

    if (isOpen) {
      checkAIStatus();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError('Please describe your project idea');
      return;
    }

    if (aiAvailable === false) {
      setError('AI service is not configured. Please contact your administrator.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await API.AI.generateProposal(userInput);

      // The API returns the full JSON directly: { success: true, data: {...} }
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || 'Failed to generate proposal');
      }
    } catch (err) {
      console.error('AI Generation Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate proposal';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = () => {
    if (result) {
      onProposalGenerated(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setUserInput('');
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  const exampleIdeas = [
    "Education project for orphan children in Colombo district providing school supplies and tutoring",
    "Health awareness program for pregnant mothers in rural areas with nutrition support",
    "Livelihood training for widows in Galle district teaching sewing and handicrafts",
    "Emergency response project providing temporary shelter and food for flood-affected families"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-navy-900 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7" />
              <div>
                <h2 className="text-2xl font-bold">AI Proposal Assistant</h2>
                <p className="text-white/90 text-sm mt-1">
                  Let AI help you write GER-compliant humanitarian proposals
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-lg disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Service Status */}
          {aiAvailable === false && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">AI Service Not Configured</h3>
                  <p className="text-sm text-yellow-800">
                    The AI proposal assistant requires configuration by your system administrator.
                    Please contact them to set up the Groq API key in the server environment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {aiAvailable === true && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">AI Service Ready</span>
              </div>
              <span className="text-xs text-green-700">Powered by Groq AI (Llama 3)</span>
            </div>
          )}


          {/* Example Ideas */}
          {!result && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Example Ideas (Click to use)</h4>
                  <div className="space-y-2">
                    {exampleIdeas.map((idea, index) => (
                      <button
                        key={index}
                        onClick={() => setUserInput(idea)}
                        disabled={loading}
                        className="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition text-sm text-ink-700 disabled:opacity-50"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div>
            <h3 className="font-semibold text-ink-900 mb-3">
              Describe Your Project Idea
            </h3>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={loading}
              placeholder="Example: I want to create an education project for orphan children in Colombo. We'll provide school supplies, tutoring, and scholarships. Target 500 children aged 5-15..."
              className="w-full px-4 py-3 border border-ink-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-ink-50 disabled:opacity-70"
              rows={6}
            />
            <p className="text-xs text-ink-500 mt-2">
              Be as detailed as possible. Include: target beneficiaries, location, activities, goals, budget range.
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !userInput.trim() || aiAvailable === false}
            className="w-full py-3 bg-navy-900 text-white rounded-xl transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating... This may take 10-30 seconds
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Proposal
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="border-t border-ink-200 pt-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Proposal Generated Successfully!</h4>
                  <p className="text-sm text-green-800">
                    Review the proposal below and click "Accept & Use Proposal" to populate the form.
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-ink-50 rounded-xl p-5 max-h-96 overflow-y-auto">
                <h4 className="font-bold text-lg text-ink-900 mb-4">{result.title}</h4>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-ink-600">Programme Area:</span>{' '}
                    <span className="font-medium text-ink-900">{result.programmeArea}</span>
                  </div>
                  <div>
                    <span className="text-ink-600">District:</span>{' '}
                    <span className="font-medium text-ink-900">{result.district}</span>
                  </div>
                  <div>
                    <span className="text-ink-600">Budget:</span>{' '}
                    <span className="font-medium text-ink-900">${result.budgetRequested?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-ink-600">Beneficiaries:</span>{' '}
                    <span className="font-medium text-ink-900">{result.targetBeneficiaries?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <h5 className="font-semibold text-ink-900 mb-1">Summary</h5>
                    <p className="text-ink-700">{result.summary}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-ink-900 mb-1">Problem Statement</h5>
                    <p className="text-ink-700">{result.problemStatement}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-ink-900 mb-1">Objectives ({result.objectives?.length || 0})</h5>
                    <ul className="list-disc list-inside text-ink-700 space-y-1">
                      {result.objectives?.slice(0, 3).map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-ink-500 italic mt-3">
                    Complete proposal includes: GER fields, MEAL framework, Theory of Change, budget breakdown, and safeguarding measures.
                  </p>
                </div>
              </div>

              {/* Accept Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-ink-300 text-ink-700 rounded-xl hover:bg-ink-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptProposal}
                  className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-xl transition font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept & Use Proposal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIProposalAssistant;
