# Google OAuth Setup Guide for Dartmaster

## Common OAuth Error: `user_unauthorized_oauth`

This error typically means that Google OAuth is not properly configured in your Appwrite project. Follow these steps to fix it:

## 1. Appwrite Console Configuration

### Step 1: Enable Google OAuth Provider
1. Go to your Appwrite Console
2. Navigate to **Auth** → **Settings** → **OAuth2 Providers**
3. Click on **Google** provider
4. Toggle it to **Enabled**

### Step 2: Configure Google OAuth Credentials
You need to add your Google OAuth credentials to Appwrite:

1. **App ID**: Your Google OAuth Client ID
2. **App Secret**: Your Google OAuth Client Secret

## 2. Google Cloud Console Setup

### Step 1: Create or Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure the project is selected in the top dropdown

### Step 2: Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the required fields:
     - App name: Dartmaster
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email` and `profile`
   - Add test users if in development

### Step 4: Configure OAuth Client
1. Application type: **Web application**
2. Name: **Dartmaster Web Client**
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
4. Authorized redirect URIs - **IMPORTANT**:
   ```
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[YOUR_PROJECT_ID]
   ```
   Replace `[YOUR_PROJECT_ID]` with your actual Appwrite project ID
   
   For example:
   ```
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/66fcee920013c509cc70
   ```

### Step 5: Get Your Credentials
After creating the OAuth client:
1. Copy the **Client ID**
2. Copy the **Client Secret**

## 3. Add Credentials to Appwrite

1. Go back to Appwrite Console
2. Navigate to **Auth** → **Settings** → **OAuth2 Providers** → **Google**
3. Paste your credentials:
   - **App ID**: Your Google Client ID
   - **App Secret**: Your Google Client Secret
4. Click **Update**

## 4. Update Your Frontend URLs

Make sure your OAuth URLs in the frontend code match your deployment:

```javascript
// In AuthContext.js
const loginWithGoogle = async () => {
  try {
    const successUrl = `${window.location.origin}/auth/callback`;
    const failureUrl = `${window.location.origin}/auth/login?error=oauth_failed`;
    
    await account.createOAuth2Session(
      'google',
      successUrl,
      failureUrl,
      ['profile', 'email']  // Scopes must match Google Console
    );
    
    return { success: true };
  } catch (error) {
    console.error("Google login error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to login with Google" 
    };
  }
};
```

## 5. Testing

### Local Development
1. Make sure your app is running on `http://localhost:3000`
2. Try the Google sign-in button
3. Check browser console for errors

### Production
1. Update the authorized origins and redirect URIs in Google Console
2. Make sure your production domain is verified
3. Test with a real Google account

## Common Issues and Solutions

### Issue: "user_unauthorized_oauth" error
**Solution**: OAuth provider is not enabled in Appwrite or credentials are missing/incorrect

### Issue: "redirect_uri_mismatch" error
**Solution**: The redirect URI in Google Console doesn't match Appwrite's callback URL

### Issue: "access_blocked" error
**Solution**: OAuth consent screen is not properly configured or app is in testing mode with limited users

### Issue: Session not created after successful Google auth
**Solution**: Check that the callback page is properly handling the OAuth response

## Environment Variables

Make sure these are set in your `.env` file:

```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
```

## Debugging Tips

1. **Check Network Tab**: Look for the OAuth redirect and callback requests
2. **Console Logs**: Added detailed logging in the callback page
3. **URL Parameters**: Check for error parameters in the redirect URL
4. **Appwrite Logs**: Check Appwrite Console → Functions → Logs for any server-side errors

## Support

If you continue to experience issues:
1. Verify all URLs match exactly (no trailing slashes)
2. Check that cookies are enabled in your browser
3. Try incognito mode to rule out cookie/cache issues
4. Contact Appwrite support with your project ID and error details