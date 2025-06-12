import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Mail, LogIn, LogOut, Loader2 } from 'lucide-react';

export default function GoogleAuth() {
  const { user, signIn, signOut, isAuthenticated, error, isDemo, isFigmaSite } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <User className="w-5 h-5" />
            Signed In Successfully
            <div className="ml-auto flex gap-1">
              <Badge variant="secondary">Google</Badge>
              {isFigmaSite && (
                <Badge 
                  variant="outline" 
                  className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700"
                >
                  Figma
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={isDemo 
                  ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700' 
                  : 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
                }
              >
                {isDemo ? 'Demo Mode' : 'Live'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-green-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Mail className="w-3 h-3" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <LogIn className="w-5 h-5" />
          Sign In to Get Started
          <div className="ml-auto flex gap-1">
            {isFigmaSite && (
              <Badge 
                variant="outline" 
                className="text-xs bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700"
              >
                Figma Site
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className="text-xs bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700"
            >
              Demo Mode Available
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Sign in with your Google account to access your personalized design delivery checklists and sync your progress across devices.
          </p>
          <div className="text-left space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-muted-foreground">Save your progress automatically</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-muted-foreground">Sync across all your devices</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-muted-foreground">Secure cloud storage with Google</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-muted-foreground">Access your Figma integrations</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        
        <Button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {isSigningIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </CardContent>
    </Card>
  );
}
