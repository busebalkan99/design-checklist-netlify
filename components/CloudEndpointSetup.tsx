import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Copy, ExternalLink, Check, AlertCircle, Info, Zap, Database, Globe } from 'lucide-react';

interface CloudEndpointSetupProps {
  currentEndpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

export default function CloudEndpointSetup({ currentEndpoint, onEndpointChange }: CloudEndpointSetupProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState(currentEndpoint);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const platforms = [
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Easiest to deploy, great for beginners',
      icon: Zap,
      endpoint: 'https://your-app.vercel.app/api',
      pros: ['Free tier available', 'Auto-deployment from Git', 'Built-in database options'],
      setup: '5 minutes'
    },
    {
      id: 'netlify',
      name: 'Netlify',
      description: 'Simple functions, good for static sites',
      icon: Globe,
      endpoint: 'https://your-app.netlify.app/.netlify/functions',
      pros: ['Easy to use', 'Good free tier', 'Fast deployment'],
      setup: '5 minutes'
    },
    {
      id: 'firebase',
      name: 'Firebase',
      description: 'Google\'s platform with built-in database',
      icon: Database,
      endpoint: 'https://your-region-your-project.cloudfunctions.net',
      pros: ['Google integration', 'Real-time database', 'Authentication'],
      setup: '10 minutes'
    }
  ];

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const testConnection = async () => {
    if (!testEndpoint) return;

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Try to make a test request to the endpoint
      const response = await fetch(`${testEndpoint}/load?userId=test`, {
        headers: {
          'Authorization': 'Bearer test_token'
        }
      });

      // Even if it returns 401, that means the endpoint is reachable
      if (response.status === 401 || response.status === 403 || response.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveEndpoint = () => {
    onEndpointChange(testEndpoint);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentEndpoint ? 'Change Endpoint' : 'Setup Cloud Endpoint'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup Cloud Endpoint</DialogTitle>
          <DialogDescription>
            Choose a platform and deploy your API to enable cloud sync across devices.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms">Choose Platform</TabsTrigger>
            <TabsTrigger value="custom">Custom Endpoint</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-6">
            <div className="grid gap-4">
              {platforms.map((platform) => (
                <Card key={platform.id} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <platform.icon className="w-6 h-6" />
                      {platform.name}
                      <Badge variant="outline" className="ml-auto">
                        {platform.setup} setup
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Endpoint URL format:</p>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                        <span className="flex-1">{platform.endpoint}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(platform.endpoint, platform.id)}
                          className="h-6 w-6 p-0"
                        >
                          {copySuccess === platform.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Benefits:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {platform.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Open the detailed guide
                          window.open('/CloudEndpointGuide.md', '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Setup Guide
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setTestEndpoint(platform.endpoint)}
                      >
                        Use This Platform
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Need help?</strong> Check the CloudEndpointGuide.md file for detailed setup instructions with sample code for each platform.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom API Endpoint URL</label>
                <Input
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  placeholder="https://your-api.example.com/api"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the base URL of your API. It should support `/save` and `/load` endpoints.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={!testEndpoint || isTestingConnection}
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
                
                {testResult && (
                  <div className="flex items-center gap-2">
                    {testResult === 'success' ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Endpoint reachable</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Connection failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>API Requirements:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• <code>POST /save</code> - Save user data with Google token auth</li>
                    <li>• <code>GET /load</code> - Load user data with Google token auth</li>
                    <li>• Support for Bearer token authentication</li>
                    <li>• CORS enabled for your domain</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveEndpoint}
            disabled={!testEndpoint}
          >
            Save Endpoint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
