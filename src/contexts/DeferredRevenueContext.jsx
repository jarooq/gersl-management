import React, { createContext, useContext, useState, useEffect } from 'react';

const DeferredRevenueContext = createContext();

export const useDeferredRevenue = () => {
  const context = useContext(DeferredRevenueContext);
  if (!context) {
    throw new Error('useDeferredRevenue must be used within DeferredRevenueProvider');
  }
  return context;
};

export const DeferredRevenueProvider = ({ children }) => {
  // Load from localStorage or use default data
  const [deferredRevenue, setDeferredRevenue] = useState(() => {
    const saved = localStorage.getItem('deferredRevenue');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage whenever deferredRevenue changes
  useEffect(() => {
    localStorage.setItem('deferredRevenue', JSON.stringify(deferredRevenue));
  }, [deferredRevenue]);

  // Add new deferred revenue project
  const addDeferredRevenue = (projectData) => {
    const newProject = {
      ...projectData,
      id: Math.max(0, ...deferredRevenue.map(d => d.id)) + 1,
      spentAmount: projectData.spentAmount || 0,
      deferredAmount: projectData.receivedAmount - (projectData.spentAmount || 0),
      status: projectData.status || 'Active'
    };
    setDeferredRevenue([...deferredRevenue, newProject]);
    return newProject;
  };

  // Update deferred revenue project
  const updateDeferredRevenue = (id, updates) => {
    setDeferredRevenue(deferredRevenue.map(project => {
      if (project.id === id) {
        const updated = { ...project, ...updates };
        // Recalculate deferred amount if spent or received changed
        if (updates.spentAmount !== undefined || updates.receivedAmount !== undefined) {
          updated.deferredAmount = updated.receivedAmount - updated.spentAmount;
        }
        return updated;
      }
      return project;
    }));
  };

  // Record expense against deferred revenue
  const recordExpense = (id, expenseAmount, description) => {
    setDeferredRevenue(deferredRevenue.map(project => {
      if (project.id === id) {
        const newSpentAmount = project.spentAmount + expenseAmount;
        return {
          ...project,
          spentAmount: newSpentAmount,
          deferredAmount: project.receivedAmount - newSpentAmount,
          lastExpense: {
            amount: expenseAmount,
            description,
            date: new Date().toISOString().split('T')[0]
          }
        };
      }
      return project;
    }));
  };

  // Recognize revenue (move from deferred to earned)
  const recognizeRevenue = (id, amount, notes) => {
    setDeferredRevenue(deferredRevenue.map(project => {
      if (project.id === id) {
        const recognizedTotal = (project.recognizedRevenue || 0) + amount;
        return {
          ...project,
          recognizedRevenue: recognizedTotal,
          deferredAmount: project.receivedAmount - recognizedTotal,
          lastRecognition: {
            amount,
            notes,
            date: new Date().toISOString().split('T')[0]
          }
        };
      }
      return project;
    }));
  };

  // Delete deferred revenue project
  const deleteDeferredRevenue = (id) => {
    setDeferredRevenue(deferredRevenue.filter(project => project.id !== id));
  };

  // Close project
  const closeProject = (id, closureNotes) => {
    setDeferredRevenue(deferredRevenue.map(project => {
      if (project.id === id) {
        return {
          ...project,
          status: 'Closed',
          closureDate: new Date().toISOString().split('T')[0],
          closureNotes
        };
      }
      return project;
    }));
  };

  // Calculate totals
  const getTotals = () => {
    const activeProjects = deferredRevenue.filter(p => p.status === 'Active' || p.status === 'Closing');
    const totalFunding = activeProjects.reduce((sum, p) => sum + p.totalFunding, 0);
    const totalReceived = activeProjects.reduce((sum, p) => sum + p.receivedAmount, 0);
    const totalSpent = activeProjects.reduce((sum, p) => sum + p.spentAmount, 0);
    const totalDeferred = activeProjects.reduce((sum, p) => sum + p.deferredAmount, 0);

    return {
      totalFunding,
      totalReceived,
      totalSpent,
      totalDeferred,
      activeProjects: activeProjects.length,
      closedProjects: deferredRevenue.filter(p => p.status === 'Closed').length,
      utilizationRate: totalReceived > 0 ? ((totalSpent / totalReceived) * 100).toFixed(1) : 0
    };
  };

  // Get projects by status
  const getByStatus = (status) => {
    return deferredRevenue.filter(project => project.status === status);
  };

  // Get projects by donor
  const getByDonor = (donorName) => {
    return deferredRevenue.filter(project => project.donorName === donorName);
  };

  // Get projects by category
  const getByCategory = (projectCategory) => {
    return deferredRevenue.filter(project => project.projectCategory === projectCategory);
  };

  // Get projects requiring action (low balance or ending soon)
  const getProjectsRequiringAction = () => {
    const today = new Date();
    const threeMonthsFromNow = new Date(today.setMonth(today.getMonth() + 3));

    return deferredRevenue.filter(project => {
      if (project.status === 'Closed') return false;

      const endDate = new Date(project.endDate);
      const utilizationRate = (project.spentAmount / project.receivedAmount) * 100;

      // Flag if ending within 3 months or utilization > 90% or < 10%
      return endDate <= threeMonthsFromNow || utilizationRate > 90 || utilizationRate < 10;
    });
  };

  // Get summary by project category
  const getSummaryByCategory = () => {
    const summary = {};
    deferredRevenue.filter(p => p.status !== 'Closed').forEach(project => {
      const category = project.projectCategory || 'Uncategorized';
      if (!summary[category]) {
        summary[category] = {
          count: 0,
          totalFunding: 0,
          received: 0,
          spent: 0,
          deferred: 0
        };
      }
      summary[category].count += 1;
      summary[category].totalFunding += project.totalFunding;
      summary[category].received += project.receivedAmount;
      summary[category].spent += project.spentAmount;
      summary[category].deferred += project.deferredAmount;
    });
    return summary;
  };

  // Get summary by donor
  const getSummaryByDonor = () => {
    const summary = {};
    deferredRevenue.filter(p => p.status !== 'Closed').forEach(project => {
      if (!summary[project.donorName]) {
        summary[project.donorName] = {
          count: 0,
          totalFunding: 0,
          received: 0,
          spent: 0,
          deferred: 0,
          projects: []
        };
      }
      summary[project.donorName].count += 1;
      summary[project.donorName].totalFunding += project.totalFunding;
      summary[project.donorName].received += project.receivedAmount;
      summary[project.donorName].spent += project.spentAmount;
      summary[project.donorName].deferred += project.deferredAmount;
      summary[project.donorName].projects.push(project.projectName);
    });
    return summary;
  };

  const value = {
    deferredRevenue,
    addDeferredRevenue,
    updateDeferredRevenue,
    recordExpense,
    recognizeRevenue,
    deleteDeferredRevenue,
    closeProject,
    getTotals,
    getByStatus,
    getByDonor,
    getByCategory,
    getProjectsRequiringAction,
    getSummaryByCategory,
    getSummaryByDonor
  };

  return (
    <DeferredRevenueContext.Provider value={value}>
      {children}
    </DeferredRevenueContext.Provider>
  );
};
