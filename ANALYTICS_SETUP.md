# Web Analytics Integration - Google Analytics 4

**Status**: ✅ Implemented
**Date**: January 2025
**Version**: 1.0

---

## Overview

The GERSL Management System now includes comprehensive Google Analytics 4 (GA4) integration for tracking user behavior, application performance, and feature usage.

## Features

### Automatic Tracking
- **User Sessions**: Tracked with user properties (role, ID) on login
- **Analytics Initialization**: Automatically loads GA4 on app mount

### Manual Tracking Available
- **Events**: Custom event tracking
- **Form Submissions**: Track form completions and errors
- **Search**: Track search queries and results
- **Downloads**: Track file downloads
- **Feature Usage**: Track specific feature interactions
- **Errors**: Track application errors
- **Performance**: Track timing metrics
- **Approvals**: Track approval workflow actions

---

## Setup Instructions

### 1. Get Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property (or use existing)
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Google Analytics 4
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Enable in development (default: false)
VITE_ENABLE_ANALYTICS_DEV=false
```

### 3. Deploy

Analytics will automatically initialize when the app loads. No additional code changes needed.

---

## Implementation Details

### Files Created

1. **`src/utils/analytics.js`**
   - Core analytics utility
   - Google Analytics 4 integration
   - All tracking functions

2. **`src/hooks/useAnalytics.js`**
   - React hooks for analytics
   - `usePageTracking()` - Automatic page view tracking
   - `useAnalytics()` - Manual tracking functions

### Files Modified

1. **`src/App.jsx`**
   - Added `initAnalytics()` call on app mount

2. **`src/routes/AppRouter.jsx`**
   - Added `PageTracker` component for automatic page view tracking

3. **`.env.example`**
   - Added GA4 configuration documentation

---

## Usage Examples

### Track Page Views

You can manually track page views when needed:

```javascript
import analytics from '../utils/analytics';

analytics.pageView('/dashboard', 'Dashboard');
```

### Track Custom Events

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'submit_form',
      page: 'orphans'
    });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Track Form Submissions

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyForm() {
  const { trackFormSubmit } = useAnalytics();

  const handleSubmit = async (data) => {
    try {
      await submitData(data);
      trackFormSubmit('orphan_registration', true);
    } catch (error) {
      trackFormSubmit('orphan_registration', false, error.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Track Search

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function SearchComponent() {
  const { trackSearch } = useAnalytics();

  const handleSearch = (query, results) => {
    trackSearch(query, results.length);
  };

  return <input onChange={(e) => handleSearch(e.target.value, results)} />;
}
```

### Track Downloads

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function DownloadButton() {
  const { trackDownload } = useAnalytics();

  const handleDownload = (file) => {
    trackDownload(file.name, file.type, file.size);
    // ... download logic
  };

  return <button onClick={handleDownload}>Download Report</button>;
}
```

### Track Feature Usage

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function FeatureComponent() {
  const { trackFeatureUsage } = useAnalytics();

  useEffect(() => {
    trackFeatureUsage('orphan_needs_tracker');
  }, []);

  return <div>...</div>;
}
```

### Track Errors

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackError } = useAnalytics();

  const handleError = (error) => {
    trackError(error.message, error.stack, { component: 'OrphansPage' });
  };

  return <ErrorBoundary onError={handleError}>...</ErrorBoundary>;
}
```

### Track Timing/Performance

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function DataLoader() {
  const { trackTiming } = useAnalytics();

  useEffect(() => {
    const start = Date.now();
    loadData().then(() => {
      const duration = Date.now() - start;
      trackTiming('data_load', duration, 'orphans');
    });
  }, []);

  return <div>...</div>;
}
```

### Track Approvals

```javascript
import { useAnalytics } from '../hooks/useAnalytics';

function ApprovalButton() {
  const { trackApproval } = useAnalytics();

  const handleApproval = (approved) => {
    trackApproval('orphan', approved, { orphan_id: 123 });
    // ... approval logic
  };

  return <button onClick={() => handleApproval(true)}>Approve</button>;
}
```

### Set User Properties

```javascript
import analytics from '../utils/analytics';

// Called automatically on login
analytics.setUserProperties({
  user_id: user.id,
  user_role: user.role,
  department: user.department
});
```

---

## Available Tracking Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `initAnalytics()` | Initialize GA4 | None |
| `pageView(path, title)` | Track page view | path, title |
| `event(name, params)` | Track custom event | name, params object |
| `login(method)` | Track login | method (e.g., 'email') |
| `logout()` | Track logout | None |
| `formSubmit(name, success, error)` | Track form submission | form name, success bool, error message |
| `search(query, results)` | Track search | query string, result count |
| `download(filename, type, size)` | Track download | filename, file type, size in bytes |
| `featureUsage(feature, params)` | Track feature use | feature name, params object |
| `error(message, stack, params)` | Track error | error message, stack trace, params |
| `timing(name, value, label)` | Track timing | metric name, duration ms, label |
| `setUserProperties(props)` | Set user props | properties object |
| `approval(type, approved, params)` | Track approval | type, approved bool, params |
| `navigation(from, to)` | Track navigation | from path, to path |

---

## Privacy & Security

### Cookie Configuration

Analytics cookies are configured with:
- `SameSite=None` - Required for cross-domain tracking
- `Secure` - HTTPS only (production)

### Data Collection

**Automatically Collected**:
- Page views and paths
- User sessions
- Device and browser info
- Geographic location (approximate)

**NOT Collected**:
- Personal information (unless explicitly set)
- Form input data
- Passwords or sensitive data

### GDPR Compliance

To make the system GDPR compliant, you should:

1. Add a cookie consent banner
2. Only initialize analytics after user consent
3. Provide opt-out option
4. Update privacy policy

**Example consent implementation**:

```javascript
// Only initialize after consent
if (userHasConsented()) {
  initAnalytics();
}
```

---

## Testing

### Development Mode

By default, analytics is **disabled in development**. To enable for testing:

```bash
# In .env
VITE_ENABLE_ANALYTICS_DEV=true
```

### Verify Installation

1. Open browser DevTools > Network tab
2. Filter by "google-analytics" or "gtag"
3. Navigate between pages
4. Check for requests to `google-analytics.com`

### Real-time Reports

1. Go to [Google Analytics](https://analytics.google.com/)
2. Navigate to Reports > Realtime
3. Perform actions in your app
4. Verify events appear in real-time report

---

## Performance Impact

- **Bundle Size**: ~15KB (Google Analytics SDK)
- **Load Time**: Async loading, no blocking
- **Runtime**: Minimal impact (<5ms per event)

---

## Advanced Configuration

### Custom Dimensions

Add custom dimensions in Google Analytics console, then track:

```javascript
analytics.event('page_view', {
  custom_dimension1: 'value',
  custom_dimension2: 'value'
});
```

### Enhanced Measurement

Enable in GA4 settings for automatic tracking of:
- Scrolling
- Outbound clicks
- Site search
- Video engagement
- File downloads

### Goals & Conversions

Set up in GA4 to track:
- Form submissions
- Orphan registrations
- Approvals completed
- Reports generated

---

## Troubleshooting

### Analytics not working

1. Check Measurement ID is correct
2. Verify environment variable is set: `VITE_GA_MEASUREMENT_ID`
3. Check browser console for errors
4. Ensure ad blockers are disabled (for testing)

### Events not showing in GA4

1. Wait 24-48 hours for data processing
2. Use Real-time reports for immediate verification
3. Check event parameters match GA4 schema

### Development mode not tracking

1. Verify `VITE_ENABLE_ANALYTICS_DEV=true` in `.env`
2. Restart development server after changing `.env`
3. Clear browser cache

---

## Future Enhancements

Potential improvements:

- [ ] Add cookie consent banner
- [ ] Implement event buffering for offline support
- [ ] Add custom dashboards in GA4
- [ ] Integrate with Google Tag Manager
- [ ] Add A/B testing support
- [ ] Track conversion funnels
- [ ] Add heat mapping integration

---

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: GERSL Development Team
