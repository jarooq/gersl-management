# Social Media Integration Guide

This guide will help you integrate your organization's social media accounts (Facebook, Instagram, Twitter, and LinkedIn) with the GERSL Management System.

## Overview

The Social Media module allows you to:
- Connect and manage multiple social media accounts
- Schedule posts across platforms
- Track analytics and engagement
- Monitor comments and messages
- View unified dashboard of all social media activity

## Access the Integration Settings

1. Login to the admin portal: `http://localhost:5173/login`
2. Navigate to **Social Media** from the sidebar
3. Click the **Settings** button in the top-right corner
4. Or directly visit: `http://localhost:5173/admin/social-media/settings`

## Platform-Specific Integration Instructions

### 1. Facebook Integration

#### Prerequisites:
- Facebook Page (not personal profile)
- Facebook Developer Account

#### Steps:
1. **Create a Facebook App:**
   - Go to https://developers.facebook.com/apps
   - Click "Create App"
   - Select "Business" as app type
   - Fill in app details and create

2. **Add Facebook Login Product:**
   - In your app dashboard, add "Facebook Login" product
   - Configure OAuth redirect URIs

3. **Get Page Access Token:**
   - Go to Graph API Explorer: https://developers.facebook.com/tools/explorer
   - Select your app
   - Select your Facebook Page
   - Request permissions: `pages_read_engagement`, `pages_manage_posts`, `pages_read_user_content`
   - Generate Access Token
   - **Important:** Convert to long-lived token using the Access Token Debugger

4. **Get Page ID:**
   - Go to your Facebook Page
   - Click "About" in the left sidebar
   - Scroll down to find your Page ID

5. **Enter Credentials:**
   - Paste Page ID into "Facebook Page ID" field
   - Paste Access Token into "Page Access Token" field
   - Enter your Page Name
   - Click "Test & Connect"

#### Required Permissions:
- `pages_read_engagement`
- `pages_manage_posts`
- `pages_read_user_content`
- `pages_show_list`

---

### 2. Instagram Integration

#### Prerequisites:
- Instagram Business Account
- Facebook Page linked to Instagram Business Account
- Facebook Developer Account

#### Steps:
1. **Convert to Business Account:**
   - Open Instagram app
   - Go to Settings → Account
   - Switch to Professional Account
   - Select Business

2. **Link to Facebook Page:**
   - Go to Settings → Account → Linked Accounts
   - Select Facebook and link your Page

3. **Get Instagram Business Account ID:**
   - Use Facebook Graph API Explorer
   - Make a GET request to: `/me/accounts`
   - Find your page and note the `instagram_business_account` ID

4. **Get Access Token:**
   - Use the same long-lived token from Facebook
   - Ensure it has Instagram permissions: `instagram_basic`, `instagram_manage_comments`, `instagram_content_publish`

5. **Enter Credentials:**
   - Paste Instagram Business Account ID
   - Paste Access Token (same as Facebook)
   - Enter your Instagram username
   - Click "Test & Connect"

#### Required Permissions:
- `instagram_basic`
- `instagram_manage_comments`
- `instagram_content_publish`
- `pages_read_engagement` (via Facebook)

---

### 3. Twitter Integration

#### Prerequisites:
- Twitter Account
- Twitter Developer Account (apply at developer.twitter.com)

#### Steps:
1. **Apply for Developer Access:**
   - Go to https://developer.twitter.com/en/apply-for-access
   - Complete the application (explain your use case)
   - Wait for approval (usually 1-2 days)

2. **Create a Twitter App:**
   - Go to https://developer.twitter.com/en/portal/dashboard
   - Click "Create App"
   - Fill in app details
   - Select "Read and Write" permissions

3. **Generate API Keys:**
   - Go to your app's "Keys and tokens" tab
   - Note your:
     - API Key (Consumer Key)
     - API Secret (Consumer Secret)
   - Click "Generate" under "Access Token and Secret"
   - Note your:
     - Access Token
     - Access Token Secret

4. **Enter Credentials:**
   - Paste API Key into "API Key (Consumer Key)" field
   - Paste API Secret into "API Secret (Consumer Secret)" field
   - Paste Access Token
   - Paste Access Token Secret
   - Enter your Twitter username
   - Click "Test & Connect"

#### API Access Level Required:
- **Essential** or higher (free tier works)
- Read and Write permissions

---

### 4. LinkedIn Integration

#### Prerequisites:
- LinkedIn Company Page
- LinkedIn Developer Account
- Organization verified on LinkedIn

#### Steps:
1. **Create LinkedIn App:**
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create app"
   - Fill in details and associate with your company page
   - Submit for review

2. **Request Required Products:**
   - Go to "Products" tab in your app
   - Request "Share on LinkedIn"
   - Request "Sign In with LinkedIn using OpenID Connect"
   - Wait for approval

3. **Get Organization ID:**
   - Make API request to: `https://api.linkedin.com/v2/organizations`
   - Or find it in your company page URL

4. **Implement OAuth 2.0:**
   - LinkedIn uses OAuth 2.0 authentication
   - You'll need to implement an OAuth flow in your backend
   - Redirect URL: `http://your-domain.com/callback/linkedin`

5. **Get Access Token:**
   - Complete OAuth flow to get access token
   - Token is valid for 60 days (refresh as needed)

6. **Enter Credentials:**
   - Paste Organization ID
   - Paste Access Token
   - Enter Company Name
   - Click "Test & Connect"

#### Required OAuth Scopes:
- `w_organization_social`
- `r_organization_social`
- `rw_organization_admin`

---

## Backend API Integration (Next Steps)

To fully enable social media integration, you'll need to implement backend API endpoints:

### Create Social Media API Service

1. **Install Required Packages:**
```bash
cd server
npm install axios facebook-nodejs-business-sdk twitter-api-v2 linkedin-api-client
```

2. **Create API Routes** (`server/src/routes/socialMedia.js`):
```javascript
import express from 'express';
import {
  connectFacebook,
  connectInstagram,
  connectTwitter,
  connectLinkedIn,
  fetchAnalytics,
  schedulePost,
  getEngagement
} from '../controllers/socialMediaController.js';

const router = express.Router();

router.post('/connect/facebook', connectFacebook);
router.post('/connect/instagram', connectInstagram);
router.post('/connect/twitter', connectTwitter);
router.post('/connect/linkedin', connectLinkedIn);
router.get('/analytics/:platform', fetchAnalytics);
router.post('/schedule', schedulePost);
router.get('/engagement', getEngagement);

export default router;
```

3. **Implement Controllers** (`server/src/controllers/socialMediaController.js`):
```javascript
// Example: Facebook connection
export const connectFacebook = async (req, res) => {
  const { pageId, accessToken } = req.body;

  try {
    // Verify token and fetch page info
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'name,followers_count,fan_count'
        }
      }
    );

    // Store credentials securely in database
    // Encrypt access token before storing

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
```

4. **Create Database Model** (`server/src/models/SocialMediaAccount.js`):
```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SocialMediaAccount = sequelize.define('SocialMediaAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'instagram', 'twitter', 'linkedin'),
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accessToken: {
    type: DataTypes.TEXT, // Encrypted
    allowNull: false
  },
  refreshToken: {
    type: DataTypes.TEXT, // Encrypted
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

export default SocialMediaAccount;
```

## Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Encrypt access tokens**
   - Use encryption before storing in database
   - Use `crypto` module or `bcrypt`

3. **Implement token refresh**
   - Most tokens expire
   - Implement automatic refresh logic

4. **Rate limiting**
   - Respect API rate limits
   - Implement queuing for posts

5. **Validate webhooks**
   - Verify webhook signatures
   - Prevent unauthorized access

## Testing Your Integration

1. **Test Connection:**
   - Enter credentials in settings
   - Click "Test & Connect"
   - Verify success message

2. **Test Posting:**
   - Schedule a test post
   - Check if it appears on the platform

3. **Test Analytics:**
   - Wait for data sync
   - Verify metrics display correctly

4. **Test Engagement:**
   - Make a comment on your post
   - Check if it appears in engagement tab

## Troubleshooting

### Common Issues:

1. **"Invalid Access Token"**
   - Token may have expired
   - Regenerate token
   - Ensure correct permissions

2. **"Rate Limit Exceeded"**
   - Implement exponential backoff
   - Reduce API call frequency

3. **"Permission Denied"**
   - Check app permissions
   - Request additional scopes
   - Re-authenticate

4. **"Webhook Verification Failed"**
   - Check webhook URL configuration
   - Verify SSL certificate
   - Check challenge/verification token

## Support and Resources

### Official Documentation:
- Facebook: https://developers.facebook.com/docs/
- Instagram: https://developers.facebook.com/docs/instagram-api
- Twitter: https://developer.twitter.com/en/docs
- LinkedIn: https://docs.microsoft.com/en-us/linkedin/

### Useful Tools:
- Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer
- Twitter API Console: https://developer.twitter.com/en/docs/tools-and-libraries
- Postman: For testing API endpoints

### Getting Help:
- Stack Overflow: Tag specific platform (facebook-api, instagram-api, etc.)
- Platform developer forums
- GitHub issues for SDK libraries

## Next Steps

1. ✅ Configure credentials in settings page
2. ⏳ Implement backend API endpoints
3. ⏳ Set up webhook handlers
4. ⏳ Implement post scheduling
5. ⏳ Add analytics sync cron jobs
6. ⏳ Enable real-time engagement tracking

## Feature Roadmap

- [ ] Multi-account support per platform
- [ ] Advanced scheduling (best time to post)
- [ ] AI-powered content suggestions
- [ ] Competitor analysis
- [ ] Automated reporting
- [ ] Social listening
- [ ] Influencer tracking
- [ ] Campaign performance tracking

---

**Last Updated:** November 2025
**Version:** 1.0.0
