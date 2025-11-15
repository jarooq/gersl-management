import React, { createContext, useContext, useState, useEffect } from 'react';
import { MEALAPI, EvaluationAPI, LearningEventAPI, ComplaintAPI } from '../services/api';

const MEALContext = createContext();

export const useMEAL = () => {
  const context = useContext(MEALContext);
  if (!context) {
    throw new Error('useMEAL must be used within a MEALProvider');
  }
  return context;
};

export const MEALProvider = ({ children }) => {
  const [indicators, setIndicators] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [learningEvents, setLearningEvents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all MEAL data from database on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel using Promise.allSettled to handle individual failures
        const [indicatorsRes, evaluationsRes, learningEventsRes, complaintsRes] = await Promise.allSettled([
          MEALAPI.getAll(),
          EvaluationAPI.getAll(),
          LearningEventAPI.getAll(),
          ComplaintAPI.getAll()
        ]);

        // Handle indicators
        if (indicatorsRes.status === 'fulfilled') {
          setIndicators(indicatorsRes.value.indicators || []);
        } else {
          console.error('Error loading indicators:', indicatorsRes.reason);
        }

        // Handle evaluations
        if (evaluationsRes.status === 'fulfilled') {
          setEvaluations(evaluationsRes.value.evaluations || []);
        } else {
          console.error('Error loading evaluations:', evaluationsRes.reason);
        }

        // Handle learning events
        if (learningEventsRes.status === 'fulfilled') {
          setLearningEvents(learningEventsRes.value.learningEvents || []);
        } else {
          console.error('Error loading learning events:', learningEventsRes.reason);
        }

        // Handle complaints
        if (complaintsRes.status === 'fulfilled') {
          setComplaints(complaintsRes.value.complaints || []);
        } else {
          console.error('Error loading complaints:', complaintsRes.reason);
        }

      } catch (err) {
        console.error('Error loading MEAL data:', err);
        setError(err.message || 'Failed to load MEAL data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // ============================================
  // INDICATOR OPERATIONS (Database)
  // ============================================

  const addIndicator = async (indicatorData) => {
    try {
      const preparedData = {
        ...indicatorData,
        code: `IND-${String(indicators.length + 1).padStart(3, '0')}`,
        current: indicatorData.baseline,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const newIndicator = await MEALAPI.create(preparedData);
      setIndicators([...indicators, newIndicator]);
      return newIndicator;
    } catch (err) {
      console.error('Error adding indicator:', err);
      throw err;
    }
  };

  const updateIndicator = async (id, updatedData) => {
    try {
      const dataWithTimestamp = {
        ...updatedData,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      const updatedIndicator = await MEALAPI.update(id, dataWithTimestamp);
      setIndicators(indicators.map(indicator =>
        indicator.id === id ? updatedIndicator : indicator
      ));
      return updatedIndicator;
    } catch (err) {
      console.error('Error updating indicator:', err);
      throw err;
    }
  };

  const deleteIndicator = async (id) => {
    try {
      await MEALAPI.delete(id);
      setIndicators(indicators.filter(indicator => indicator.id !== id));
    } catch (err) {
      console.error('Error deleting indicator:', err);
      throw err;
    }
  };

  // ============================================
  // EVALUATION OPERATIONS (Database)
  // ============================================

  const addEvaluation = async (evaluationData) => {
    try {
      const preparedData = {
        ...evaluationData,
        evaluationCode: `EVAL-${new Date().getFullYear()}-${String(evaluations.length + 1).padStart(3, '0')}`,
        reportStatus: evaluationData.reportStatus || 'Pending',
        status: evaluationData.status || 'Planned'
      };

      const newEvaluation = await EvaluationAPI.create(preparedData);
      setEvaluations([...evaluations, newEvaluation]);
      return newEvaluation;
    } catch (err) {
      console.error('Error adding evaluation:', err);
      throw err;
    }
  };

  const updateEvaluation = async (id, updatedData) => {
    try {
      const updatedEvaluation = await EvaluationAPI.update(id, updatedData);
      setEvaluations(evaluations.map(evaluation =>
        evaluation.id === id ? updatedEvaluation : evaluation
      ));
      return updatedEvaluation;
    } catch (err) {
      console.error('Error updating evaluation:', err);
      throw err;
    }
  };

  const deleteEvaluation = async (id) => {
    try {
      await EvaluationAPI.delete(id);
      setEvaluations(evaluations.filter(evaluation => evaluation.id !== id));
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      throw err;
    }
  };

  // ============================================
  // LEARNING EVENT OPERATIONS (Database)
  // ============================================

  const addLearningEvent = async (eventData) => {
    try {
      const preparedData = {
        ...eventData,
        eventCode: `LE-${new Date().getFullYear()}-${String(learningEvents.length + 1).padStart(3, '0')}`,
        status: eventData.status || 'Planned'
      };

      const newEvent = await LearningEventAPI.create(preparedData);
      setLearningEvents([...learningEvents, newEvent]);
      return newEvent;
    } catch (err) {
      console.error('Error adding learning event:', err);
      throw err;
    }
  };

  const updateLearningEvent = async (id, updatedData) => {
    try {
      const updatedEvent = await LearningEventAPI.update(id, updatedData);
      setLearningEvents(learningEvents.map(event =>
        event.id === id ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      console.error('Error updating learning event:', err);
      throw err;
    }
  };

  const deleteLearningEvent = async (id) => {
    try {
      await LearningEventAPI.delete(id);
      setLearningEvents(learningEvents.filter(event => event.id !== id));
    } catch (err) {
      console.error('Error deleting learning event:', err);
      throw err;
    }
  };

  const addParticipant = async (eventId, participant) => {
    try {
      const updatedEvent = await LearningEventAPI.addParticipant(eventId, participant);
      setLearningEvents(learningEvents.map(event =>
        event.id === eventId ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
      console.error('Error adding participant:', err);
      throw err;
    }
  };

  // ============================================
  // COMPLAINT OPERATIONS (Database)
  // ============================================

  const addComplaint = async (complaintData) => {
    try {
      const preparedData = {
        ...complaintData,
        ticketNumber: `CMP-${new Date().getFullYear()}-${String(complaints.length + 1).padStart(3, '0')}`,
        submittedDate: complaintData.submittedDate || new Date().toISOString().split('T')[0],
        status: complaintData.status || 'Open',
        priority: complaintData.priority || 'Medium'
      };

      const newComplaint = await ComplaintAPI.create(preparedData);
      setComplaints([...complaints, newComplaint]);
      return newComplaint;
    } catch (err) {
      console.error('Error adding complaint:', err);
      throw err;
    }
  };

  const updateComplaint = async (id, updatedData) => {
    try {
      const updatedComplaint = await ComplaintAPI.update(id, updatedData);
      setComplaints(complaints.map(complaint =>
        complaint.id === id ? updatedComplaint : complaint
      ));
      return updatedComplaint;
    } catch (err) {
      console.error('Error updating complaint:', err);
      throw err;
    }
  };

  const deleteComplaint = async (id) => {
    try {
      await ComplaintAPI.delete(id);
      setComplaints(complaints.filter(complaint => complaint.id !== id));
    } catch (err) {
      console.error('Error deleting complaint:', err);
      throw err;
    }
  };

  const assignComplaint = async (id, assignedTo) => {
    try {
      const updatedComplaint = await ComplaintAPI.assign(id, assignedTo);
      setComplaints(complaints.map(complaint =>
        complaint.id === id ? updatedComplaint : complaint
      ));
      return updatedComplaint;
    } catch (err) {
      console.error('Error assigning complaint:', err);
      throw err;
    }
  };

  // ============================================
  // STATISTICS
  // ============================================

  const getStats = () => {
    const totalIndicators = indicators.length;
    const onTrackIndicators = indicators.filter(i => i.status === 'On Track').length;
    const atRiskIndicators = indicators.filter(i => i.status === 'At Risk').length;
    const offTrackIndicators = indicators.filter(i => i.status === 'Off Track').length;

    const totalEvaluations = evaluations.length;
    const completedEvaluations = evaluations.filter(e => e.status === 'Completed').length;
    const inProgressEvaluations = evaluations.filter(e => e.status === 'In Progress').length;

    const totalComplaints = complaints.length;
    const openComplaints = complaints.filter(c => c.status === 'Open').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    const avgSatisfaction = complaints
      .filter(c => c.satisfactionRating !== null && c.satisfactionRating !== undefined)
      .reduce((sum, c) => sum + c.satisfactionRating, 0) / complaints.filter(c => c.satisfactionRating !== null && c.satisfactionRating !== undefined).length || 0;

    return {
      totalIndicators,
      onTrackIndicators,
      atRiskIndicators,
      offTrackIndicators,
      totalEvaluations,
      completedEvaluations,
      inProgressEvaluations,
      totalComplaints,
      openComplaints,
      resolvedComplaints,
      resolutionRate,
      avgSatisfaction: avgSatisfaction.toFixed(1)
    };
  };

  const value = {
    indicators,
    evaluations,
    learningEvents,
    complaints,
    loading,
    error,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    addLearningEvent,
    updateLearningEvent,
    deleteLearningEvent,
    addParticipant,
    addComplaint,
    updateComplaint,
    deleteComplaint,
    assignComplaint,
    getStats
  };

  return (
    <MEALContext.Provider value={value}>
      {children}
    </MEALContext.Provider>
  );
};
