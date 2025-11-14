// ============================================
// WEB ANALYTICS UTILITY
// ============================================
// Centralized analytics tracking for the application
// Supports Google Analytics 4 (GA4)

/**
 * Initialize analytics (called once on app load)
 */
export const initAnalytics = () => {
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.log('📊 Analytics: Not configured (no VITE_GA_MEASUREMENT_ID)');
    }
    return;
  }

  // Only load analytics in production or if explicitly enabled
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_ANALYTICS_DEV === 'true') {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // We'll send page views manually for SPA
      cookie_flags: 'SameSite=None;Secure', // Cookie security
    });

    if (import.meta.env.DEV) {
      console.log('📊 Analytics: Initialized with ID', GA_MEASUREMENT_ID);
    }
  }
};

/**
 * Track page view
 * @param {string} path - Page path (e.g., '/dashboard')
 * @param {string} title - Page title
 */
export const trackPageView = (path, title) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });

    if (import.meta.env.DEV) {
      console.log('📊 Analytics: Page view', { path, title });
    }
  }
};

/**
 * Track custom event
 * @param {string} eventName - Event name (e.g., 'login', 'form_submit')
 * @param {object} params - Event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);

    if (import.meta.env.DEV) {
      console.log('📊 Analytics: Event', eventName, params);
    }
  }
};

/**
 * Track user login
 * @param {string} method - Login method (e.g., 'email', 'google')
 * @param {string} userId - User ID (optional, for user tracking)
 */
export const trackLogin = (method = 'email', userId = null) => {
  trackEvent('login', {
    method,
    ...(userId && { user_id: userId }),
  });
};

/**
 * Track user logout
 */
export const trackLogout = () => {
  trackEvent('logout');
};

/**
 * Track form submission
 * @param {string} formName - Name of the form
 * @param {boolean} success - Whether submission was successful
 */
export const trackFormSubmit = (formName, success = true) => {
  trackEvent('form_submit', {
    form_name: formName,
    success,
  });
};

/**
 * Track search
 * @param {string} searchTerm - Search query
 * @param {string} searchType - Type of search (e.g., 'orphans', 'projects')
 */
export const trackSearch = (searchTerm, searchType = 'general') => {
  trackEvent('search', {
    search_term: searchTerm,
    search_type: searchType,
  });
};

/**
 * Track file download
 * @param {string} fileName - Name of downloaded file
 * @param {string} fileType - Type of file (e.g., 'pdf', 'csv')
 */
export const trackDownload = (fileName, fileType) => {
  trackEvent('file_download', {
    file_name: fileName,
    file_type: fileType,
  });
};

/**
 * Track feature usage
 * @param {string} featureName - Name of the feature (e.g., 'orphan_map', 'finance_report')
 * @param {object} params - Additional parameters
 */
export const trackFeatureUsage = (featureName, params = {}) => {
  trackEvent('feature_usage', {
    feature_name: featureName,
    ...params,
  });
};

/**
 * Track error
 * @param {string} errorMessage - Error message
 * @param {boolean} fatal - Whether error is fatal
 */
export const trackError = (errorMessage, fatal = false) => {
  trackEvent('exception', {
    description: errorMessage,
    fatal,
  });
};

/**
 * Track timing (performance metric)
 * @param {string} name - Name of the metric
 * @param {number} value - Time in milliseconds
 * @param {string} category - Category (e.g., 'api', 'render')
 */
export const trackTiming = (name, value, category = 'general') => {
  trackEvent('timing_complete', {
    name,
    value,
    event_category: category,
  });
};

/**
 * Set user properties (for identifying user segments)
 * @param {object} properties - User properties
 */
export const setUserProperties = (properties) => {
  if (typeof window.gtag === 'function') {
    window.gtag('set', 'user_properties', properties);

    if (import.meta.env.DEV) {
      console.log('📊 Analytics: User properties set', properties);
    }
  }
};

/**
 * Track approval action
 * @param {string} itemType - Type of item (e.g., 'orphan', 'expense')
 * @param {string} action - Action taken (e.g., 'approved', 'rejected')
 */
export const trackApproval = (itemType, action) => {
  trackEvent('approval_action', {
    item_type: itemType,
    action,
  });
};

/**
 * Track navigation
 * @param {string} from - Previous page
 * @param {string} to - Target page
 */
export const trackNavigation = (from, to) => {
  trackEvent('navigation', {
    from,
    to,
  });
};

// Export analytics object for easy import
const analytics = {
  init: initAnalytics,
  pageView: trackPageView,
  event: trackEvent,
  login: trackLogin,
  logout: trackLogout,
  formSubmit: trackFormSubmit,
  search: trackSearch,
  download: trackDownload,
  featureUsage: trackFeatureUsage,
  error: trackError,
  timing: trackTiming,
  setUserProperties,
  approval: trackApproval,
  navigation: trackNavigation,
};

export default analytics;
