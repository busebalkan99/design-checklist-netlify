import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Figma, FileText, Users, Calendar, Link, AlertCircle } from 'lucide-react';

interface FigmaFileInfo {
  name: string;
  fileId: string;
  url: string;
  lastModified: Date;
  collaborators: number;
  isValid: boolean;
}

interface FigmaPluginProps {
  onCreateTask: (taskName: string, figmaUrl?: string) => void;
}

export default function FigmaPlugin({ onCreateTask }: FigmaPluginProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaFile, setFigmaFile] = useState<FigmaFileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse Figma URL and extract file information
  const parseFigmaUrl = (url: string): FigmaFileInfo | null => {
    try {
      // Figma URL patterns:
      // https://www.figma.com/file/[file-id]/[file-name]
      // https://www.figma.com/design/[file-id]/[file-name]
      const figmaUrlRegex = /https:\/\/(?:www\.)?figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)\/([^?/]+)/;
      const match = url.match(figmaUrlRegex);

      if (!match) {
        return null;
      }

      const [, fileId, encodedFileName] = match;
      
      // Decode and clean up the file name
      let fileName = decodeURIComponent(encodedFileName);
      fileName = fileName.replace(/-/g, ' ').replace(/\?.*$/, ''); // Remove query params and replace hyphens
      
      // Capitalize first letter of each word
      fileName = fileName.replace(/\b\w/g, l => l.toUpperCase());

      return {
        name: fileName,
        fileId,
        url,
        lastModified: new Date(),
        collaborators: Math.floor(Math.random() * 5) + 1, // Mock collaborator count
        isValid: true
      };
    } catch (err) {
      return null;
    }
  };

  const handleUrlSubmit = async () => {
    if (!figmaUrl.trim()) {
      setError('Please enter a Figma URL');
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const parsedFile = parseFigmaUrl(figmaUrl.trim());

    if (!parsedFile) {
      setError('Invalid Figma URL. Please enter a valid Figma file or design URL.');
      setIsProcessing(false);
      return;
    }

    setFigmaFile(parsedFile);
    setIsProcessing(false);
  };

  const handleCreateTaskFromFigma = () => {
    if (figmaFile) {
      onCreateTask(figmaFile.name, figmaFile.url);
      // Reset the form after creating task
      setFigmaUrl('');
      setFigmaFile(null);
      setError(null);
    }
  };

  const handleReset = () => {
    setFigmaUrl('');
    setFigmaFile(null);
    setError(null);
  };

  if (figmaFile && figmaFile.isValid) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Figma className="w-5 h-5" />
            Figma File Ready
            <Badge variant="secondary" className="ml-auto">Parsed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{figmaFile.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {figmaFile.fileId}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{figmaFile.collaborators} collaborators</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Parsed {figmaFile.lastModified.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Task will be created as: <strong>"{figmaFile.name}"</strong>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={handleCreateTaskFromFigma} 
              className="flex-1"
              size="sm"
            >
              <Figma className="w-4 h-4 mr-2" />
              Create Task
            </Button>
            <Button 
              onClick={handleReset} 
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Figma className="w-5 h-5" />
          Create from Figma Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Paste Figma file URL here..."
            value={figmaUrl}
            onChange={(e) => {
              setFigmaUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Example: https://www.figma.com/design/abc123/My-Design-File
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleUrlSubmit} 
          disabled={!figmaUrl.trim() || isProcessing}
          className="w-full"
          size="sm"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin mr-2">
                <Figma className="w-4 h-4" />
              </div>
              Processing...
            </>
          ) : (
            <>
              <Link className="w-4 h-4 mr-2" />
              Parse Figma URL
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
