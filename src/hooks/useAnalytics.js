import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../utils/analytics';

/**
 * Hook to track page views automatically on route changes
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Get page title from document or route
    const pageTitle = document.title || location.pathname;

    // Track page view
    analytics.pageView(location.pathname + location.search, pageTitle);
  }, [location]);
};

/**
 * Hook for analytics utilities
 * @returns {object} Analytics functions
 */
export const useAnalytics = () => {
  return {
    trackEvent: analytics.event,
    trackFormSubmit: analytics.formSubmit,
    trackSearch: analytics.search,
    trackDownload: analytics.download,
    trackFeatureUsage: analytics.featureUsage,
    trackError: analytics.error,
    trackTiming: analytics.timing,
    trackApproval: analytics.approval,
    trackNavigation: analytics.navigation,
  };
};

export default useAnalytics;
