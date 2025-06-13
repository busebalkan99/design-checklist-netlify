import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Cloud, CloudOff, Download, Upload, Settings, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import { useAuth } from './AuthContext';
import CloudEndpointSetup from './CloudEndpointSetup';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface CloudStorageProps {
  data: any;
  onDataLoad: (data: any) => void;
  onSyncStatusChange?: (status: SyncStatus) => void;
}

interface StorageConfig {
  endpoint: string;
  autoSync: boolean;
}

export default function CloudStorage({ data, onDataLoad, onSyncStatusChange }: CloudStorageProps) {
  const { user, isAuthenticated, isDemo } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [config, setConfig] = useState<StorageConfig>({
    endpoint: localStorage.getItem('checklist-endpoint') || '',
    autoSync: localStorage.getItem('checklist-auto-sync') !== 'false' // Default to true
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-sync when data changes (only if authenticated)
  useEffect(() => {
    if (config.autoSync && data && Object.keys(data).length > 0 && isAuthenticated) {
      const syncTimeout = setTimeout(() => {
        handleSync();
      }, 2000); // Debounce auto-sync
      
      return () => clearTimeout(syncTimeout);
    }
  }, [data, config.autoSync, isAuthenticated]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadFromLocal();
      if (config.endpoint && user) {
        loadFromCloud();
      }
    }
  }, [isAuthenticated, user]);

  // Notify parent of sync status changes
  useEffect(() => {
    onSyncStatusChange?.(syncStatus);
  }, [syncStatus, onSyncStatusChange]);

  const updateSyncStatus = (status: SyncStatus) => {
    setSyncStatus(status);
    if (status === 'synced') {
      setLastSync(new Date());
      setError(null);
    }
  };

  const getStorageKey = (suffix: string) => {
    return user ? `checklist-${user.id}-${suffix}` : `checklist-${suffix}`;
  };

  const saveToLocal = (data: any) => {
    try {
      const storageKey = getStorageKey('data');
      const timestampKey = getStorageKey('last-modified');
      
      localStorage.setItem(storageKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, new Date().toISOString());
    } catch (err) {
      console.error('Failed to save to local storage:', err);
    }
  };

  const loadFromLocal = () => {
    try {
      const storageKey = getStorageKey('data');
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        onDataLoad(parsedData);
      }
    } catch (err) {
      console.error('Failed to load from local storage:', err);
    }
  };

  const saveToCloud = async (data: any): Promise<boolean> => {
    if (!config.endpoint || !user) {
      throw new Error('Cloud storage not configured or user not authenticated');
    }

    try {
      const accessToken = localStorage.getItem('google-access-token');
      if (!accessToken) {
        throw new Error('No access token available. Please sign in again.');
      }

      const response = await fetch(`${config.endpoint}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          data: data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please sign out and sign in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (err) {
      throw err;
    }
  };

  const loadFromCloud = async (): Promise<any> => {
    if (!config.endpoint || !user) {
      throw new Error('Cloud storage not configured or user not authenticated');
    }

    try {
      updateSyncStatus('syncing');
      
      const accessToken = localStorage.getItem('google-access-token');
      if (!accessToken) {
        throw new Error('No access token available. Please sign in again.');
      }

      const response = await fetch(`${config.endpoint}/load?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please sign out and sign in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      updateSyncStatus('offline');
      throw err;
    }
  };

  const handleSync = async () => {
    if (!data || !isAuthenticated || !user) return;

    try {
      updateSyncStatus('syncing');
      
      // Save to local storage first
      saveToLocal(data);
      
      // Try to save to cloud if endpoint is configured
      if (config.endpoint) {
        await saveToCloud(data);
        updateSyncStatus('synced');
      } else {
        updateSyncStatus('offline');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      updateSyncStatus('error');
    }
  };

  const handleCloudLoad = async () => {
    if (!isAuthenticated || !user) return;

    try {
      updateSyncStatus('syncing');
      const cloudData = await loadFromCloud();
      
      if (cloudData) {
        onDataLoad(cloudData);
        saveToLocal(cloudData);
        updateSyncStatus('synced');
      } else {
        updateSyncStatus('offline');
      }
    } catch (err) {
      console.error('Cloud load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load from cloud');
      updateSyncStatus('error');
    }
  };

  const handleExport = () => {
    const exportData = {
      data,
      exportedAt: new Date().toISOString(),
      exportedBy: user ? { name: user.name, email: user.email, id: user.id } : null,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-checklist-${user?.given_name || 'backup'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.data) {
          onDataLoad(importData.data);
          saveToLocal(importData.data);
          if (config.autoSync && isAuthenticated) {
            handleSync();
          }
        }
      } catch (err) {
        setError('Invalid backup file format');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleEndpointChange = (endpoint: string) => {
    const newConfig = { ...config, endpoint };
    setConfig(newConfig);
    localStorage.setItem('checklist-endpoint', endpoint);
    
    if (endpoint && user) {
      handleCloudLoad();
    }
  };

  const saveConfig = () => {
    localStorage.setItem('checklist-endpoint', config.endpoint);
    localStorage.setItem('checklist-auto-sync', config.autoSync.toString());
    setIsConfigDialogOpen(false);
    
    if (config.endpoint && user) {
      handleCloudLoad();
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'offline':
        return <CloudOff className="w-4 h-4 text-gray-500" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getSyncStatusText = () => {
    if (!isAuthenticated) return 'Sign in required';
    
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return lastSync ? `Synced ${lastSync.toLocaleTimeString()}` : 'Synced';
      case 'error':
        return 'Sync failed';
      case 'offline':
        return config.endpoint ? 'Local storage only' : 'No cloud endpoint';
      default:
        return 'Not synced';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <CloudOff className="w-5 h-5" />
            Cloud Storage
            <Badge variant="outline" className="ml-auto">Offline</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in with Google to enable cloud storage and sync your progress across devices.
          </p>
          
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-muted-foreground mb-2">Local Backup Options</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!data || Object.keys(data).length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Cloud className="w-5 h-5" />
          Cloud Storage
          <div className="ml-auto flex gap-1">
            <Badge variant="outline">
              {user.given_name}
            </Badge>
            <Badge variant="outline" className={isDemo ? "bg-orange-100 text-orange-800 border-orange-300" : "bg-green-100 text-green-800 border-green-300"}>
              {isDemo ? 'Demo' : 'Live'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSyncStatusIcon()}
            <span className="text-sm">{getSyncStatusText()}</span>
          </div>
          <div className="flex gap-1">
            {!config.endpoint && (
              <CloudEndpointSetup
                currentEndpoint={config.endpoint}
                onEndpointChange={handleEndpointChange}
              />
            )}
            <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cloud Storage Settings</DialogTitle>
                  <DialogDescription>
                    Configure your cloud storage endpoint and sync preferences for your Google account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm">Google Account</label>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto text-xs bg-green-100 text-green-800 border-green-300">
                        {isDemo ? 'Demo' : 'Authenticated'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm">Cloud Endpoint</label>
                    <div className="flex gap-2">
                      <Input
                        value={config.endpoint}
                        onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                        placeholder="https://your-api-endpoint.com"
                      />
                      {!config.endpoint && (
                        <CloudEndpointSetup
                          currentEndpoint={config.endpoint}
                          onEndpointChange={(endpoint) => setConfig(prev => ({ ...prev, endpoint }))}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Enter your backend API endpoint for cloud sync. Leave empty to use local storage only.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={config.autoSync}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                    />
                    <label htmlFor="autoSync" className="text-sm">
                      Auto-sync changes to cloud storage
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveConfig}>
                      Save Settings
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!config.endpoint && (
          <Alert>
            <Plus className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup cloud sync:</strong> Add a cloud endpoint to sync your data across devices. 
              <CloudEndpointSetup
                currentEndpoint={config.endpoint}
                onEndpointChange={handleEndpointChange}
              />
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
          >
            <Upload className="w-4 h-4 mr-2" />
            Sync Now
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloudLoad}
            disabled={syncStatus === 'syncing' || !config.endpoint}
          >
            <Download className="w-4 h-4 mr-2" />
            Load Cloud
          </Button>
        </div>

        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-muted-foreground mb-2">Backup Options</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <label>
              <Button
                variant="outline"
                size="sm"
                className="w-full cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
