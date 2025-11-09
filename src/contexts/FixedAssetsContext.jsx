import React, { createContext, useContext, useState, useEffect } from 'react';

const FixedAssetsContext = createContext();

export const useFixedAssets = () => {
  const context = useContext(FixedAssetsContext);
  if (!context) {
    throw new Error('useFixedAssets must be used within FixedAssetsProvider');
  }
  return context;
};

export const FixedAssetsProvider = ({ children }) => {
  // Load from localStorage or use default data
  const [fixedAssets, setFixedAssets] = useState(() => {
    const saved = localStorage.getItem('fixedAssets');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage whenever fixedAssets changes
  useEffect(() => {
    localStorage.setItem('fixedAssets', JSON.stringify(fixedAssets));
  }, [fixedAssets]);

  // Calculate depreciation for an asset
  const calculateDepreciation = (asset, currentYear) => {
    const acquisitionYear = new Date(asset.acquisitionDate).getFullYear();
    const yearsOwned = currentYear - acquisitionYear;

    if (asset.depreciationMethod === 'Reducing Balance') {
      let bookValue = asset.cost;
      let totalDepreciation = 0;

      for (let i = 0; i < yearsOwned; i++) {
        const yearDepreciation = bookValue * (asset.depreciationRate / 100);
        totalDepreciation += yearDepreciation;
        bookValue -= yearDepreciation;
      }

      return {
        accumulatedDepreciation: Math.round(totalDepreciation),
        writtenDownValue: Math.round(asset.cost - totalDepreciation),
        currentYearDepreciation: yearsOwned > 0 ? Math.round(bookValue * (asset.depreciationRate / 100)) : 0
      };
    } else if (asset.depreciationMethod === 'Straight Line') {
      const usefulLife = asset.usefulLife || 5;
      const annualDepreciation = asset.cost / usefulLife;
      const totalDepreciation = Math.min(annualDepreciation * yearsOwned, asset.cost);

      return {
        accumulatedDepreciation: Math.round(totalDepreciation),
        writtenDownValue: Math.round(asset.cost - totalDepreciation),
        currentYearDepreciation: yearsOwned < usefulLife ? Math.round(annualDepreciation) : 0
      };
    }

    return {
      accumulatedDepreciation: 0,
      writtenDownValue: asset.cost,
      currentYearDepreciation: 0
    };
  };

  // Update depreciation for all assets
  const updateAllDepreciation = () => {
    const currentYear = new Date().getFullYear();
    setFixedAssets(fixedAssets.map(asset => {
      const depreciation = calculateDepreciation(asset, currentYear);
      return {
        ...asset,
        accumulatedDepreciation: depreciation.accumulatedDepreciation,
        writtenDownValue: depreciation.writtenDownValue
      };
    }));
  };

  // Add new fixed asset
  const addFixedAsset = (assetData) => {
    const currentYear = new Date().getFullYear();
    const depreciation = calculateDepreciation(assetData, currentYear);

    const newAsset = {
      ...assetData,
      id: Math.max(0, ...fixedAssets.map(a => a.id)) + 1,
      accumulatedDepreciation: depreciation.accumulatedDepreciation,
      writtenDownValue: depreciation.writtenDownValue
    };

    setFixedAssets([...fixedAssets, newAsset]);
    return newAsset;
  };

  // Update fixed asset
  const updateFixedAsset = (id, updates) => {
    setFixedAssets(fixedAssets.map(asset => {
      if (asset.id === id) {
        const updated = { ...asset, ...updates };
        // Recalculate depreciation if relevant fields changed
        if (updates.cost || updates.acquisitionDate || updates.depreciationRate || updates.depreciationMethod) {
          const currentYear = new Date().getFullYear();
          const depreciation = calculateDepreciation(updated, currentYear);
          updated.accumulatedDepreciation = depreciation.accumulatedDepreciation;
          updated.writtenDownValue = depreciation.writtenDownValue;
        }
        return updated;
      }
      return asset;
    }));
  };

  // Delete fixed asset
  const deleteFixedAsset = (id) => {
    setFixedAssets(fixedAssets.filter(asset => asset.id !== id));
  };

  // Dispose fixed asset
  const disposeFixedAsset = (id, disposalData) => {
    setFixedAssets(fixedAssets.map(asset => {
      if (asset.id === id) {
        return {
          ...asset,
          disposed: true,
          disposalDate: disposalData.disposalDate,
          disposalAmount: disposalData.disposalAmount,
          disposalNotes: disposalData.disposalNotes,
          gainLoss: disposalData.disposalAmount - asset.writtenDownValue
        };
      }
      return asset;
    }));
  };

  // Get totals
  const getTotals = () => {
    const activeAssets = fixedAssets.filter(a => !a.disposed);
    const totalCost = activeAssets.reduce((sum, asset) => sum + asset.cost, 0);
    const totalAccumulatedDepreciation = activeAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
    const totalWrittenDownValue = activeAssets.reduce((sum, asset) => sum + asset.writtenDownValue, 0);

    const currentYear = new Date().getFullYear();
    const totalCurrentYearDepreciation = activeAssets.reduce((sum, asset) => {
      const depreciation = calculateDepreciation(asset, currentYear);
      return sum + depreciation.currentYearDepreciation;
    }, 0);

    return {
      totalCost,
      totalAccumulatedDepreciation,
      totalWrittenDownValue,
      totalCurrentYearDepreciation,
      totalAssets: activeAssets.length,
      disposedAssets: fixedAssets.filter(a => a.disposed).length
    };
  };

  // Get assets by type
  const getByType = (assetType) => {
    return fixedAssets.filter(asset => asset.assetType === assetType && !asset.disposed);
  };

  // Get depreciation schedule
  const getDepreciationSchedule = (assetId, years = 5) => {
    const asset = fixedAssets.find(a => a.id === assetId);
    if (!asset) return [];

    const acquisitionYear = new Date(asset.acquisitionDate).getFullYear();
    const schedule = [];

    let bookValue = asset.cost;

    for (let i = 0; i < years; i++) {
      const year = acquisitionYear + i;
      let depreciation = 0;

      if (asset.depreciationMethod === 'Reducing Balance') {
        depreciation = bookValue * (asset.depreciationRate / 100);
      } else if (asset.depreciationMethod === 'Straight Line') {
        const usefulLife = asset.usefulLife || 5;
        depreciation = asset.cost / usefulLife;
      }

      const accumulatedDepreciation = asset.cost - bookValue + depreciation;

      schedule.push({
        year,
        openingBalance: Math.round(bookValue),
        depreciation: Math.round(depreciation),
        accumulatedDepreciation: Math.round(accumulatedDepreciation),
        closingBalance: Math.round(bookValue - depreciation)
      });

      bookValue -= depreciation;

      if (bookValue <= 0) break;
    }

    return schedule;
  };

  // Get summary by asset type
  const getSummaryByType = () => {
    const summary = {};
    const activeAssets = fixedAssets.filter(a => !a.disposed);

    activeAssets.forEach(asset => {
      if (!summary[asset.assetType]) {
        summary[asset.assetType] = {
          count: 0,
          totalCost: 0,
          totalAccumulatedDepreciation: 0,
          totalWrittenDownValue: 0
        };
      }

      summary[asset.assetType].count += 1;
      summary[asset.assetType].totalCost += asset.cost;
      summary[asset.assetType].totalAccumulatedDepreciation += asset.accumulatedDepreciation;
      summary[asset.assetType].totalWrittenDownValue += asset.writtenDownValue;
    });

    return summary;
  };

  const value = {
    fixedAssets,
    addFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
    disposeFixedAsset,
    updateAllDepreciation,
    calculateDepreciation,
    getTotals,
    getByType,
    getDepreciationSchedule,
    getSummaryByType
  };

  return (
    <FixedAssetsContext.Provider value={value}>
      {children}
    </FixedAssetsContext.Provider>
  );
};
