# Frontend-Backend Integration Guide

**Date:** November 7, 2025
**Status:** Complete API Service Layer Created

---

## Overview

This guide provides step-by-step instructions to integrate the GERSL frontend with the backend API. The API service layer has been created and is ready for use.

---

## Prerequisites

1. **Backend Running**
   ```bash
   cd server
   npm run dev
   # Server should be running on http://localhost:3000
   ```

2. **Frontend Environment Configured**
   - `.env` file created with API URL
   - All dependencies installed

---

## What's Been Created

### 1. **API Service Layer** ✅
**Location:** [src/services/api.js](src/services/api.js)

**Features:**
- Centralized API communication
- Automatic token management
- Auto-retry with token refresh
- Error handling
- Request timeout (30s)
- All 70+ endpoint functions

**Usage Example:**
```javascript
import API from '@/services/api';

// Login
const { user, accessToken } = await API.Auth.login({
  username: 'admin',
  password: 'admin123'
});

// Get orphans
const { orphans, pagination } = await API.Orphan.getAll({
  page: 1,
  limit: 10,
  district: 'Ampara'
});

// Create orphan
const newOrphan = await API.Orphan.create(orphanData);
```

### 2. **Environment Configuration** ✅
**Files:**
- `.env` - Local configuration
- `.env.example` - Template for deployment

**Variables:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
```

### 3. **Token Management** ✅
**Features:**
- Automatic token storage (localStorage)
- Token injection in requests
- Auto-refresh on expiration
- Secure token handling

---

## Integration Steps

### Step 1: Update AuthContext

**File:** [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)

**Changes Required:**

```javascript
import API from '../services/api';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = API.TokenManager.getAccessToken();
      if (token) {
        try {
          const user = await API.Auth.getCurrentUser();
          setCurrentUser(user);
          setIsLoggedIn(true);
        } catch (error) {
          API.TokenManager.clearTokens();
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (username, password) => {
    try {
      const { user } = await API.Auth.login({ username, password });
      setCurrentUser(user);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await API.Auth.logout();
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  };

  // ... rest of context
};
```

### Step 2: Update OrphanContext

**File:** [src/contexts/OrphanContext.jsx](src/contexts/OrphanContext.jsx)

**Changes Required:**

```javascript
import API from '../services/api';

export const OrphanProvider = ({ children }) => {
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10
  });

  // Fetch orphans from API
  const fetchOrphans = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await API.Orphan.getAll({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
      setOrphans(data.orphans);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add orphan
  const addOrphan = async (orphanData) => {
    try {
      const newOrphan = await API.Orphan.create(orphanData);
      setOrphans(prev => [newOrphan, ...prev]);
      return { success: true, orphan: newOrphan };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Update orphan
  const updateOrphan = async (id, orphanData) => {
    try {
      const updated = await API.Orphan.update(id, orphanData);
      setOrphans(prev =>
        prev.map(o => o.id === id ? updated : o)
      );
      return { success: true, orphan: updated };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Delete orphan
  const deleteOrphan = async (id) => {
    try {
      await API.Orphan.delete(id);
      setOrphans(prev => prev.filter(o => o.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Approve orphan
  const approveOrphan = async (id, status, remarks) => {
    try {
      const updated = await API.Orphan.approve(id, status, remarks);
      setOrphans(prev =>
        prev.map(o => o.id === id ? updated : o)
      );
      return { success: true, orphan: updated };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Get statistics
  const getStats = async (filters = {}) => {
    try {
      return await API.Orphan.getStats(filters);
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  };

  return (
    <OrphanContext.Provider value={{
      orphans,
      loading,
      error,
      pagination,
      fetchOrphans,
      addOrphan,
      updateOrphan,
      deleteOrphan,
      approveOrphan,
      getStats
    }}>
      {children}
    </OrphanContext.Provider>
  );
};
```

### Step 3: Update Other Contexts

Apply the same pattern to all contexts:

1. **ProjectContext** - Use `API.Project.*`
2. **FinanceContext** - Use `API.Finance.*`
3. **HRContext** - Use `API.HR.*`
4. **CBOContext** - Use `API.CBO.*`
5. **PartnersContext** - Use `API.Partner.*`
6. **MEALContext** - Use `API.MEAL.*`

### Step 4: Update Pages to Fetch Data

**Example: OrphansPage.jsx**

```javascript
import { useOrphan } from '../../contexts/OrphanContext';

const OrphansPage = () => {
  const { orphans, loading, fetchOrphans, pagination } = useOrphan();

  useEffect(() => {
    fetchOrphans(); // Fetch on mount
  }, []);

  const handlePageChange = (page) => {
    fetchOrphans({ page });
  };

  const handleFilterChange = (filters) => {
    fetchOrphans(filters);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Render orphans */}
      {orphans.map(orphan => (
        <OrphanCard key={orphan.id} orphan={orphan} />
      ))}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
```

### Step 5: Update Login Page

**File:** [src/pages/Login.jsx](src/pages/Login.jsx)

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);

    if (result.success) {
      // Redirect happens automatically via AuthContext
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Step 6: File Upload Integration

**Example: Upload Orphan Document**

```javascript
import API from '../services/api';

const handleFileUpload = async (file) => {
  try {
    const uploadedFile = await API.Upload.uploadOrphanDocument(file);
    console.log('Uploaded:', uploadedFile);
    // uploadedFile contains: { filename, url, path, size, mimetype }

    // Save the file reference to orphan
    await API.Orphan.update(orphanId, {
      documents: {
        ...existingDocuments,
        [documentType]: uploadedFile.path
      }
    });
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Multiple files
const handleMultipleFiles = async (files) => {
  try {
    const uploadedFiles = await API.Upload.uploadOrphanDocuments(files);
    console.log('Uploaded:', uploadedFiles);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

## Error Handling

### API Errors

The API service automatically handles common errors:

```javascript
try {
  const orphan = await API.Orphan.create(data);
} catch (error) {
  // error.status - HTTP status code (400, 401, 404, etc.)
  // error.message - Error message
  // error.errors - Validation errors array

  if (error.status === 401) {
    // Unauthorized - redirect to login
  } else if (error.status === 400) {
    // Validation error
    console.log(error.errors);
  } else if (error.status === 403) {
    // Permission denied
  } else {
    // Other errors
  }
}
```

### Display Errors to Users

```javascript
const [error, setError] = useState(null);

const handleSubmit = async () => {
  try {
    await API.Orphan.create(data);
    setError(null);
  } catch (err) {
    setError(err.message);
  }
};

return (
  <div>
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )}
    {/* Form */}
  </div>
);
```

---

## Testing the Integration

### 1. Start Backend
```bash
cd server
npm run seed  # Initialize database
npm run dev   # Start server on :3000
```

### 2. Start Frontend
```bash
cd ..
npm run dev   # Start frontend on :5176
```

### 3. Test Login Flow

1. Open http://localhost:5176
2. Try logging in with test credentials:
   - Username: `admin`
   - Password: `admin123`
3. Check browser console for API calls
4. Verify token is stored in localStorage
5. Navigate to different pages
6. Verify data loads from backend

### 4. Test CRUD Operations

**Create Orphan:**
1. Navigate to Orphans page
2. Click "Add Orphan"
3. Fill in form
4. Submit
5. Check network tab for POST request
6. Verify orphan appears in list

**Update Orphan:**
1. Click on an orphan
2. Click "Edit"
3. Change some fields
4. Submit
5. Verify PUT request
6. Verify updates appear

**Delete Orphan:**
1. Click delete button
2. Confirm
3. Verify DELETE request
4. Verify orphan removed from list

### 5. Test Permissions

1. Login as different roles
2. Try accessing restricted features
3. Verify permission checks work
4. Test approval workflows

---

## Common Issues & Solutions

### Issue 1: CORS Error

**Symptom:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
```javascript
// server/.env
CORS_ORIGIN=http://localhost:5176
```

### Issue 2: 401 Unauthorized

**Symptom:** All requests return 401

**Solution:**
- Check token is being sent in headers
- Verify backend is running
- Check JWT_SECRET matches
- Try logging in again

### Issue 3: Network Timeout

**Symptom:** "Request timeout"

**Solution:**
```javascript
// Increase timeout in .env
VITE_API_TIMEOUT=60000  # 60 seconds
```

### Issue 4: Data Not Loading

**Symptom:** Empty lists, no data

**Solution:**
1. Check backend database has data
2. Run `npm run seed` to populate
3. Check network tab for API response
4. Verify pagination parameters

### Issue 5: File Upload Fails

**Symptom:** Upload returns error

**Solution:**
- Check file size (<5MB)
- Verify file type is allowed
- Check uploads directory exists
- Verify multer configuration

---

## API Service Reference

### Available APIs

```javascript
import API from '@/services/api';

// Authentication
API.Auth.login(credentials)
API.Auth.logout()
API.Auth.getCurrentUser()
API.Auth.refreshToken()
API.Auth.updateProfile(data)
API.Auth.changePassword(data)

// Orphans
API.Orphan.getAll(params)
API.Orphan.getById(id)
API.Orphan.create(data)
API.Orphan.update(id, data)
API.Orphan.delete(id)
API.Orphan.approve(id, status, remarks)
API.Orphan.getStats(params)
API.Orphan.getByCoordinator(coordinatorId)

// Projects
API.Project.getAll(params)
API.Project.getById(id)
API.Project.create(data)
API.Project.update(id, data)
API.Project.delete(id)
API.Project.updateProgress(id, progress, beneficiaries)
API.Project.getExpenses(id)
API.Project.getIndicators(id)
API.Project.getStats(params)

// Finance
API.Finance.getAll(params)
API.Finance.getById(id)
API.Finance.create(data)
API.Finance.update(id, data)
API.Finance.delete(id)
API.Finance.approve(id, status, remarks)
API.Finance.markAsPaid(id, paymentMethod)
API.Finance.getPending()
API.Finance.getStats(params)

// HR
API.HR.getAll(params)
API.HR.getById(id)
API.HR.create(data)
API.HR.update(id, data)
API.HR.delete(id)
API.HR.getStats(params)

// CBO
API.CBO.getAll(params)
API.CBO.getById(id)
API.CBO.create(data)
API.CBO.update(id, data)
API.CBO.delete(id)
API.CBO.getStats(params)

// Partners
API.Partner.getAll(params)
API.Partner.getById(id)
API.Partner.create(data)
API.Partner.update(id, data)
API.Partner.delete(id)
API.Partner.getStats(params)

// MEAL
API.MEAL.getAll(params)
API.MEAL.getById(id)
API.MEAL.create(data)
API.MEAL.update(id, data)
API.MEAL.delete(id)
API.MEAL.updateProgress(id, current, status)
API.MEAL.getStats(params)

// File Upload
API.Upload.uploadOrphanDocument(file)
API.Upload.uploadOrphanDocuments(files)
API.Upload.uploadProjectDocument(file)
API.Upload.uploadProjectDocuments(files)
API.Upload.uploadFinanceDocument(file)
API.Upload.uploadProfileImage(file)
API.Upload.deleteFile(filepath)

// Health Check
API.Health.check()

// Token Management
API.TokenManager.getAccessToken()
API.TokenManager.getRefreshToken()
API.TokenManager.setTokens(access, refresh)
API.TokenManager.clearTokens()
```

---

## Next Steps

1. ✅ API Service Layer Created
2. ⚠️ Update AuthContext to use API
3. ⚠️ Update OrphanContext to use API
4. ⚠️ Update other contexts to use API
5. ⚠️ Update pages to fetch data on mount
6. ⚠️ Test complete user flow
7. ⚠️ Fix any integration issues
8. ⚠️ Performance testing
9. ⚠️ Security testing
10. ⚠️ Deploy to production

---

## Support

For integration issues:
1. Check network tab in browser DevTools
2. Check backend console logs
3. Verify environment variables
4. Test backend endpoints with Postman/curl
5. Review error messages carefully

---

**Integration Status:** API Layer Ready ✅
**Next:** Update contexts to use API
**Timeline:** 2-3 days for complete integration
