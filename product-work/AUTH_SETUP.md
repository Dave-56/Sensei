# Authentication Setup Guide

## Environment Variables

Create a `.env` file in the `client` directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend Configuration (for development)
VITE_API_URL=http://localhost:3000
```

## Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your project URL and anon key
3. Enable email authentication in Authentication > Settings
4. Configure your site URL in Authentication > URL Configuration

## Features Implemented

### ✅ Authentication System
- **Supabase Client**: Configured with auto-refresh and session persistence
- **Auth Context**: React context for managing auth state across the app
- **Login Form**: Email/password login with validation and error handling
- **Signup Form**: User registration with full name, email, password confirmation
- **Protected Routes**: Automatic redirect to auth page for unauthenticated users
- **API Integration**: Automatic Bearer token inclusion in API requests

### ✅ User Experience
- **Form Validation**: Zod schema validation with helpful error messages
- **Loading States**: Spinner indicators during authentication
- **Password Visibility**: Toggle to show/hide passwords
- **Toast Notifications**: Success and error feedback
- **Responsive Design**: Mobile-friendly auth forms
- **Theme Support**: Works with light/dark themes

### ✅ Security Features
- **JWT Verification**: Backend validates Supabase JWT tokens
- **Session Management**: Automatic token refresh and persistence
- **Protected API**: All dashboard API calls include auth headers
- **Secure Headers**: Proper CORS and credential handling

## Usage

1. **Sign Up**: New users can create accounts with email verification
2. **Sign In**: Existing users can log in with email/password
3. **Auto-redirect**: Unauthenticated users are redirected to `/auth`
4. **Session Persistence**: Users stay logged in across browser sessions
5. **Logout**: Users can sign out from the profile dropdown

## Backend Integration

The authentication system integrates with your existing backend:

- **Dashboard Routes**: Protected with `requireAuth` middleware
- **JWT Verification**: Uses `SUPABASE_JWT_SECRET` for token validation
- **API Headers**: Automatic `Authorization: Bearer <token>` inclusion
- **Error Handling**: Proper 401 responses trigger auth redirects

## Next Steps

1. Set up your Supabase project and add environment variables
2. Test the authentication flow
3. Customize the auth forms if needed
4. Add password reset functionality
5. Implement email verification flow
