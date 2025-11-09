import React, { createContext, useContext, useState } from 'react';

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

  // CRUD Operations for Indicators
  const addIndicator = (indicatorData) => {
    const newIndicator = {
      ...indicatorData,
      id: indicators.length + 1,
      code: `IND-${String(indicators.length + 1).padStart(3, '0')}`,
      current: indicatorData.baseline,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setIndicators([...indicators, newIndicator]);
    return newIndicator;
  };

  const updateIndicator = (id, updatedData) => {
    setIndicators(indicators.map(indicator =>
      indicator.id === id ? { ...indicator, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : indicator
    ));
  };

  const deleteIndicator = (id) => {
    setIndicators(indicators.filter(indicator => indicator.id !== id));
  };

  // CRUD Operations for Evaluations
  const addEvaluation = (evaluationData) => {
    const newEvaluation = {
      ...evaluationData,
      id: evaluations.length + 1,
      reportStatus: 'Pending',
      attachments: 0
    };
    setEvaluations([...evaluations, newEvaluation]);
    return newEvaluation;
  };

  const updateEvaluation = (id, updatedData) => {
    setEvaluations(evaluations.map(evaluation =>
      evaluation.id === id ? { ...evaluation, ...updatedData } : evaluation
    ));
  };

  const deleteEvaluation = (id) => {
    setEvaluations(evaluations.filter(evaluation => evaluation.id !== id));
  };

  // CRUD Operations for Learning Events
  const addLearningEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: learningEvents.length + 1
    };
    setLearningEvents([...learningEvents, newEvent]);
    return newEvent;
  };

  const updateLearningEvent = (id, updatedData) => {
    setLearningEvents(learningEvents.map(event =>
      event.id === id ? { ...event, ...updatedData } : event
    ));
  };

  const deleteLearningEvent = (id) => {
    setLearningEvents(learningEvents.filter(event => event.id !== id));
  };

  // CRUD Operations for Complaints
  const addComplaint = (complaintData) => {
    const newComplaint = {
      ...complaintData,
      id: complaints.length + 1,
      ticketNumber: `CMP-${new Date().getFullYear()}-${String(complaints.length + 1).padStart(3, '0')}`,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'Open'
    };
    setComplaints([...complaints, newComplaint]);
    return newComplaint;
  };

  const updateComplaint = (id, updatedData) => {
    setComplaints(complaints.map(complaint =>
      complaint.id === id ? { ...complaint, ...updatedData } : complaint
    ));
  };

  const deleteComplaint = (id) => {
    setComplaints(complaints.filter(complaint => complaint.id !== id));
  };

  // Get Stats
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
      .filter(c => c.satisfactionRating !== null)
      .reduce((sum, c) => sum + c.satisfactionRating, 0) / complaints.filter(c => c.satisfactionRating !== null).length || 0;

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
    addIndicator,
    updateIndicator,
    deleteIndicator,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    addLearningEvent,
    updateLearningEvent,
    deleteLearningEvent,
    addComplaint,
    updateComplaint,
    deleteComplaint,
    getStats
  };

  return (
    <MEALContext.Provider value={value}>
      {children}
    </MEALContext.Provider>
  );
};
