import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { 
  Palette, Image, Code, Users, FileDown, Database, 
  Loader2, Check, CheckCircle
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface ChecklistCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  [key: string]: boolean;
}

export default function ChecklistApp() {
  const { user, isDemo } = useAuth();
  const [checklists, setChecklists] = useState<ChecklistData>({});
  const [activeTab, setActiveTab] = useState('design');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Professional checklist categories
  const checklistCategories: Record<string, ChecklistCategory> = {
    design: {
      title: 'Design System & Standards',
      icon: Palette,
      description: 'Core design requirements and system documentation',
      items: [
        { id: 'design-system', text: 'Design system components documented and standardized', priority: 'high' },
        { id: 'responsive-breakpoints', text: 'Responsive breakpoints defined for all screen sizes', priority: 'high' },
        { id: 'accessibility-wcag', text: 'WCAG 2.1 AA accessibility standards implemented', priority: 'high' },
        { id: 'color-palette', text: 'Color palette with usage guidelines and contrast ratios', priority: 'medium' },
        { id: 'typography-system', text: 'Typography scale, hierarchy, and web font implementation', priority: 'medium' },
        { id: 'spacing-grid', text: 'Consistent spacing system and 8px/4px grid alignment', priority: 'medium' },
        { id: 'component-states', text: 'All interactive component states designed (hover, focus, active, disabled)', priority: 'high' },
        { id: 'dark-mode', text: 'Dark mode variants and theme switching implemented', priority: 'low' },
        { id: 'motion-guidelines', text: 'Animation and transition guidelines documented', priority: 'low' }
      ]
    },
    assets: {
      title: 'Asset Preparation & Delivery',
      icon: Image,
      description: 'All design assets optimized and ready for development',
      items: [
        { id: 'icons-svg-optimized', text: 'All icons exported as optimized SVG with consistent sizing', priority: 'high' },
        { id: 'images-webp', text: 'Images optimized in WebP format with fallbacks', priority: 'high' },
        { id: 'logo-variations', text: 'Logo variations provided (horizontal, stacked, monogram, favicon)', priority: 'high' },
        { id: 'custom-fonts', text: 'Custom fonts provided with proper licensing and formats', priority: 'medium' },
        { id: 'illustrations-vector', text: 'Illustrations provided as scalable vector formats', priority: 'medium' },
        { id: 'photography-optimized', text: 'Photography assets cropped and optimized for all breakpoints', priority: 'medium' },
        { id: 'asset-organization', text: 'Asset folder structure organized and clearly labeled', priority: 'low' },
        { id: 'retina-variants', text: '2x and 3x resolution variants for high-DPI displays', priority: 'low' }
      ]
    },
    handoff: {
      title: 'Developer Handoff & Documentation',
      icon: Code,
      description: 'Complete specifications and documentation for development team',
      items: [
        { id: 'design-specs', text: 'Detailed design specifications with measurements and spacing', priority: 'high' },
        { id: 'interaction-documentation', text: 'All interactions, animations, and micro-interactions documented', priority: 'high' },
        { id: 'component-documentation', text: 'Component usage guidelines and implementation notes', priority: 'high' },
        { id: 'edge-cases-documented', text: 'Edge cases, error states, and empty states designed', priority: 'high' },
        { id: 'responsive-behavior', text: 'Responsive behavior and breakpoint specifications documented', priority: 'high' },
        { id: 'performance-requirements', text: 'Performance requirements and optimization guidelines', priority: 'medium' },
        { id: 'browser-compatibility', text: 'Browser compatibility requirements specified', priority: 'medium' },
        { id: 'implementation-timeline', text: 'Development timeline and milestone deliverables defined', priority: 'medium' },
        { id: 'qa-checklist', text: 'Quality assurance checklist and testing scenarios provided', priority: 'low' }
      ]
    },
    collaboration: {
      title: 'Team Collaboration & Review',
      icon: Users,
      description: 'Stakeholder review and team collaboration processes',
      items: [
        { id: 'stakeholder-approval', text: 'Final design approval from all key stakeholders', priority: 'high' },
        { id: 'design-review', text: 'Design review completed with development team', priority: 'high' },
        { id: 'content-review', text: 'Content review and copywriting finalized', priority: 'high' },
        { id: 'brand-compliance', text: 'Brand guidelines compliance verified', priority: 'medium' },
        { id: 'legal-compliance', text: 'Legal and regulatory compliance checked', priority: 'medium' },
        { id: 'user-testing', text: 'User testing completed and feedback incorporated', priority: 'medium' },
        { id: 'feedback-incorporated', text: 'All feedback from reviews incorporated into final design', priority: 'high' },
        { id: 'handoff-meeting', text: 'Handoff meeting scheduled and conducted with dev team', priority: 'medium' }
      ]
    }
  };

  // Load saved data on component mount
  useEffect(() => {
    if (user?.id) {
      const savedData = localStorage.getItem(`checklist-data-${user.id}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setChecklists(parsed.checklists || {});
        } catch (err) {
          console.error('Failed to parse saved checklist data:', err);
        }
      }
    }
  }, [user?.id]);

  // Auto-save functionality
  useEffect(() => {
    if (user?.id && Object.keys(checklists).length > 0) {
      setSaveStatus('saving');
      const timeoutId = setTimeout(() => {
        const dataToSave = { 
          checklists, 
          timestamp: new Date().toISOString() 
        };
        localStorage.setItem(`checklist-data-${user.id}`, JSON.stringify(dataToSave));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [checklists, user?.id]);

  const toggleItem = (itemId: string) => {
    setChecklists(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getProgress = (categoryItems: ChecklistItem[]) => {
    const completed = categoryItems.filter(item => checklists[item.id]).length;
    return Math.round((completed / categoryItems.length) * 100);
  };

  const getTotalProgress = () => {
    const allItems = Object.values(checklistCategories).flatMap(cat => cat.items);
    const completed = allItems.filter(item => checklists[item.id]).length;
    return Math.round((completed / allItems.length) * 100);
  };

  const exportChecklist = () => {
    const data = {
      user: user?.name,
      email: user?.email,
      exportDate: new Date().toISOString(),
      totalProgress: getTotalProgress(),
      categories: {} as any
    };

    Object.entries(checklistCategories).forEach(([key, category]) => {
      data.categories[key] = {
        title: category.title,
        progress: getProgress(category.items),
        items: category.items.map(item => ({
          text: item.text,
          completed: !!checklists[item.id],
          priority: item.priority
        }))
      };
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-checklist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header with user info and progress */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl">Design Delivery Checklist</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {user?.given_name || 'User'}! Track your design delivery progress with our comprehensive professional checklist.
            </p>
          </div>
          
          {/* Overall Progress Card */}
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTotalProgress()}%</span>
                    {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {saveStatus === 'saved' && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
                <Progress value={getTotalProgress()} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Object.values(checklistCategories).flatMap(cat => cat.items).filter(item => checklists[item.id]).length} completed</span>
                  <span>{Object.values(checklistCategories).flatMap(cat => cat.items).length} total</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={exportChecklist}
            variant="outline"
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export Progress
          </Button>
          <Badge 
            variant="outline"
            className={isDemo 
              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' 
              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
            }
          >
            <Database className="w-3 h-3 mr-1" />
            {isDemo ? 'Demo Mode - Local Storage' : 'Cloud Sync Enabled'}
          </Badge>
        </div>

        {/* Category Tabs */}
        <div className="w-full">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {Object.entries(checklistCategories).map(([key, category]) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={key}
                  variant={activeTab === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(key)}
                  className="flex-1 flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.title.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {Object.entries(checklistCategories).map(([key, category]) => {
              if (activeTab !== key) return null;
              
              const progress = getProgress(category.items);
              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <category.icon className="w-6 h-6" />
                          {category.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                          {progress}% Complete
                        </Badge>
                        <Progress value={progress} className="w-24 h-2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border bg-card transition-all ${
                            checklists[item.id] 
                              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            checked={!!checklists[item.id]}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`text-sm ${
                                  checklists[item.id] ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {index + 1}. {item.text}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}
                                >
                                  {item.priority.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
