import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Google OAuth Client ID interface
interface AuthContextType {
  user: GoogleUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  error: string | null;
  isDemo: boolean;
  accessToken: string | null;
  currentOrigin: string;
  isFigmaSite: boolean;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

interface AuthProviderProps {
  children: ReactNode;
  clientId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Determine environment
  const currentOrigin = window.location.origin;
  const isFigmaSite = currentOrigin.includes('.figma.site') || 
                     currentOrigin.includes('figma') || 
                     currentOrigin.includes('localhost');

  useEffect(() => {
    // Check if we should use demo mode
    if (isFigmaSite) {
      setIsDemo(true);
      // Try to load demo user from localStorage
      const storedDemoUser = localStorage.getItem('demo-google-user');
      if (storedDemoUser) {
        try {
          setUser(JSON.parse(storedDemoUser));
        } catch (err) {
          console.error('Failed to parse stored demo user:', err);
        }
      }
    } else {
      // Try to load real user from localStorage
      const storedUser = localStorage.getItem('google-user');
      const storedToken = localStorage.getItem('google-access-token');
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }
    }
    setIsLoading(false);
  }, [isFigmaSite]);

  const signIn = async () => {
    if (isDemo) {
      // Demo sign in with realistic user data
      const demoUser: GoogleUser = {
        id: 'demo_user_' + Date.now(),
        email: 'demo@designchecklist.com',
        name: 'Demo User',
        picture: 'https://ui-avatars.com/api/?name=Demo+User&background=4285f4&color=fff&size=200',
        given_name: 'Demo',
        family_name: 'User'
      };
      setUser(demoUser);
      localStorage.setItem('demo-google-user', JSON.stringify(demoUser));
      setError(null);
    } else {
      try {
        // Real Google OAuth implementation would go here
        // For now, fall back to demo mode
        setError('Real Google OAuth requires additional setup. Using demo mode for now.');
        setIsDemo(true);
        setTimeout(() => signIn(), 100);
      } catch (err) {
        setError('Failed to sign in with Google');
        console.error('Sign in error:', err);
      }
    }
  };

  const signOut = () => {
    setUser(null);
    setError(null);
    setAccessToken(null);
    if (isDemo) {
      localStorage.removeItem('demo-google-user');
    } else {
      localStorage.removeItem('google-user');
      localStorage.removeItem('google-access-token');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    error,
    isDemo,
    accessToken,
    currentOrigin,
    isFigmaSite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
