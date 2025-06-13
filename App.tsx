import { useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import ChecklistApp from './components/ChecklistApp';
import GoogleAuth from './components/GoogleAuth';

// Your Google OAuth Client ID
const GOOGLE_CLIENT_ID = '74711016854-qfe6528f0ocvqg3rl1o78ngl1nhj97ed.apps.googleusercontent.com';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Load Google Identity Services library
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.getElementById('google-identity-services')) {
        return; // Already loaded
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Identity Services loaded');
        // Initialize Google with your client ID
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: () => {}, // This will be handled by AuthContext
          });
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
      };

      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto pt-20 p-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl">Design Delivery Checklist</h1>
              <p className="text-muted-foreground">
                Sign in with your Google account to access your personalized design delivery checklists and sync your progress across devices.
              </p>
            </div>
            
            <GoogleAuth />
            
            <div className="pt-6 border-t">
              <h3 className="text-lg mb-3">Why sign in?</h3>
              <div className="text-left space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Save your progress automatically</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Sync across all your devices</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Access your Figma integrations</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Secure cloud storage with Google</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChecklistApp />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </AuthProvider>
  );
}

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
