"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  Calendar, FileText, Settings, Plus, Trash2, Save, AlertCircle, 
  CheckCircle, BookOpen, List, Layout, Clock, Brain, Stethoscope, Award
} from "lucide-react"
import { useToast } from "../ui/use-toast"

export function AbstractsSettingsManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/config')
      const data = await response.json()
      if (data.success) {
        // Ensure new ISSH 2026 fields exist with defaults
        const configData = {
          ...data.data,
          submittingForOptions: data.data.submittingForOptions || [
            { key: 'neurosurgery', label: 'Neurosurgery', enabled: true },
            { key: 'neurology', label: 'Neurology', enabled: true }
          ],
          submissionCategories: data.data.submissionCategories || [
            { key: 'award-paper', label: 'Award Paper', enabled: true },
            { key: 'free-paper', label: 'Free Paper', enabled: true },
            { key: 'e-poster', label: 'E-Poster', enabled: true }
          ],
          topicsBySpecialty: data.data.topicsBySpecialty || {
            neurosurgery: ['Skullbase', 'Vascular', 'Neuro Oncology', 'Paediatric Neurosurgery', 'Spine', 'Functional', 'General Neurosurgery', 'Miscellaneous'],
            neurology: ['General Neurology', 'Neuroimmunology', 'Stroke', 'Neuromuscular Disorders', 'Epilepsy', 'Therapeutics in Neurology', 'Movement Disorders', 'Miscellaneous']
          }
        }
        setConfig(configData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load abstracts settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/abstracts/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Abstracts settings saved successfully"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Topic management for specialties
  const addTopic = (specialty: 'neurosurgery' | 'neurology') => {
    setConfig({
      ...config,
      topicsBySpecialty: {
        ...config.topicsBySpecialty,
        [specialty]: [...(config.topicsBySpecialty?.[specialty] || []), '']
      }
    })
  }

  const removeTopic = (specialty: 'neurosurgery' | 'neurology', index: number) => {
    const newTopics = [...(config.topicsBySpecialty?.[specialty] || [])]
    newTopics.splice(index, 1)
    setConfig({
      ...config,
      topicsBySpecialty: {
        ...config.topicsBySpecialty,
        [specialty]: newTopics
      }
    })
  }

  const updateTopic = (specialty: 'neurosurgery' | 'neurology', index: number, value: string) => {
    const newTopics = [...(config.topicsBySpecialty?.[specialty] || [])]
    newTopics[index] = value
    setConfig({
      ...config,
      topicsBySpecialty: {
        ...config.topicsBySpecialty,
        [specialty]: newTopics
      }
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ISSH 2026 Abstracts Configuration
          </CardTitle>
          <CardDescription>
            Manage abstract submission settings for Neurosurgery and Neurology specialties
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dates" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="dates" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Dates
          </TabsTrigger>
          <TabsTrigger value="specialties" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Stethoscope className="h-4 w-4 mr-2" />
            Specialties
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Award className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="topics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <List className="h-4 w-4 mr-2" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BookOpen className="h-4 w-4 mr-2" />
            Guidelines
          </TabsTrigger>
        </TabsList>

        {/* Dates Tab */}
        <TabsContent value="dates">
          <Card>
            <CardHeader>
              <CardTitle>Submission Window</CardTitle>
              <CardDescription>Configure when users can submit abstracts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                config.submissionWindow?.enabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}>
                <div>
                  <Label className="text-base font-semibold">Enable Submissions</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {config.submissionWindow?.enabled 
                      ? 'Submissions are currently OPEN - Users can submit abstracts' 
                      : 'Submissions are currently CLOSED - Users will see "Coming Soon"'}
                  </p>
                </div>
                <Switch
                  checked={config.submissionWindow?.enabled}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    submissionWindow: { ...config.submissionWindow, enabled: checked }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={config.submissionWindow?.start ? new Date(config.submissionWindow.start).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({
                      ...config,
                      submissionWindow: { ...config.submissionWindow, start: new Date(e.target.value).toISOString() }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={config.submissionWindow?.end ? new Date(config.submissionWindow.end).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({
                      ...config,
                      submissionWindow: { ...config.submissionWindow, end: new Date(e.target.value).toISOString() }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Current window: {config.submissionWindow?.enabled ? 'Active' : 'Inactive'} | 
                  {' '}{config.submissionWindow?.start ? new Date(config.submissionWindow.start).toLocaleDateString() : 'Not set'} to{' '}
                  {config.submissionWindow?.end ? new Date(config.submissionWindow.end).toLocaleDateString() : 'Not set'}
                </AlertDescription>
              </Alert>

              {/* Enable Abstracts Without Registration Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                config.enableAbstractsWithoutRegistration 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
              }`}>
                <div>
                  <Label className="text-base font-semibold">Enable Abstracts Without Registration</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {config.enableAbstractsWithoutRegistration 
                      ? 'ENABLED - Unregistered users can submit abstracts (for sponsor-managed registrations)' 
                      : 'DISABLED - Only registered and paid users can submit abstracts'}
                  </p>
                </div>
                <Switch
                  checked={config.enableAbstractsWithoutRegistration || false}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    enableAbstractsWithoutRegistration: checked
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specialties Tab (Submitting For) */}
        <TabsContent value="specialties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Submitting For Options
              </CardTitle>
              <CardDescription>Configure which specialties are available for abstract submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.submittingForOptions?.map((option: any, index: number) => (
                <div key={option.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {option.key === 'neurosurgery' ? (
                      <Brain className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                    )}
                    <div>
                      <Label className="font-semibold">{option.label}</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Key: {option.key}</p>
                    </div>
                  </div>
                  <Switch
                    checked={option.enabled}
                    onCheckedChange={(checked) => {
                      const newOptions = [...config.submittingForOptions]
                      newOptions[index].enabled = checked
                      setConfig({ ...config, submittingForOptions: newOptions })
                    }}
                  />
                </div>
              ))}
              
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Users will select either Neurosurgery or Neurology when submitting their abstract. 
                  The available topics will change based on their selection.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab (Submission Categories) */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Submission Categories
              </CardTitle>
              <CardDescription>Configure available submission categories (Award Paper, Free Paper, Poster)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.submissionCategories?.map((category: any, index: number) => (
                <div key={category.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      category.key === 'award-paper' ? 'bg-yellow-100 text-yellow-700' :
                      category.key === 'free-paper' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {category.key === 'award-paper' ? <Award className="h-4 w-4" /> :
                       category.key === 'free-paper' ? <FileText className="h-4 w-4" /> :
                       <Layout className="h-4 w-4" />}
                    </div>
                    <div>
                      <Label className="font-semibold">{category.label}</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Key: {category.key}</p>
                    </div>
                  </div>
                  <Switch
                    checked={category.enabled}
                    onCheckedChange={(checked) => {
                      const newCategories = [...config.submissionCategories]
                      newCategories[index].enabled = checked
                      setConfig({ ...config, submissionCategories: newCategories })
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <div className="space-y-6">
            {/* Neurosurgery Topics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle>Neurosurgery Topics</CardTitle>
                      <CardDescription>Topics available when user selects Neurosurgery</CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => addTopic('neurosurgery')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.topicsBySpecialty?.neurosurgery?.map((topic: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {index + 1}
                    </Badge>
                    <Input
                      value={topic}
                      onChange={(e) => updateTopic('neurosurgery', index, e.target.value)}
                      placeholder="Enter topic name"
                      className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTopic('neurosurgery', index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!config.topicsBySpecialty?.neurosurgery || config.topicsBySpecialty.neurosurgery.length === 0) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No topics configured for Neurosurgery. Add topics above.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Neurology Topics */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-purple-600" />
                    <div>
                      <CardTitle>Neurology Topics</CardTitle>
                      <CardDescription>Topics available when user selects Neurology</CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => addTopic('neurology')} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.topicsBySpecialty?.neurology?.map((topic: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {index + 1}
                    </Badge>
                    <Input
                      value={topic}
                      onChange={(e) => updateTopic('neurology', index, e.target.value)}
                      placeholder="Enter topic name"
                      className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTopic('neurology', index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!config.topicsBySpecialty?.neurology || config.topicsBySpecialty.neurology.length === 0) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No topics configured for Neurology. Add topics above.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines">
          <div className="space-y-6">
            {/* General Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  General Guidelines
                </CardTitle>
                <CardDescription>Main guidelines displayed at the top of the abstracts page</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.guidelines?.general || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    guidelines: { ...config.guidelines, general: e.target.value }
                  })}
                  rows={10}
                  placeholder="Enter general submission guidelines..."
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">This text is displayed in the guidelines section. Use line breaks for formatting.</p>
              </CardContent>
            </Card>

            {/* Award Paper / Free Paper Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Award Paper / Free Paper Guidelines
                </CardTitle>
                <CardDescription>Guidelines specific to Award Paper and Free Paper submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <Label className="font-semibold">Enable Free Paper Category</Label>
                    <p className="text-sm text-slate-500">Allow users to submit Free Papers</p>
                  </div>
                  <Switch
                    checked={config.guidelines?.freePaper?.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        freePaper: { ...config.guidelines?.freePaper, enabled: checked } 
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Section Title</Label>
                  <Input
                    value={config.guidelines?.freePaper?.title || 'Free Paper / Award Paper Guidelines'}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        freePaper: { ...config.guidelines?.freePaper, title: e.target.value } 
                      }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Word Limit</Label>
                    <Input
                      type="number"
                      value={config.guidelines?.freePaper?.wordLimit || 200}
                      onChange={(e) => setConfig({
                        ...config,
                        guidelines: { 
                          ...config.guidelines, 
                          freePaper: { ...config.guidelines?.freePaper, wordLimit: parseInt(e.target.value) } 
                        }
                      })}
                      className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Max Submissions Per User</Label>
                    <Input
                      type="number"
                      value={config.maxAbstractsPerUser || 10}
                      onChange={(e) => setConfig({
                        ...config,
                        maxAbstractsPerUser: parseInt(e.target.value)
                      })}
                      className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Requirements (one per line)</Label>
                  <Textarea
                    value={config.guidelines?.freePaper?.requirements?.join('\n') || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        freePaper: { ...config.guidelines?.freePaper, requirements: e.target.value.split('\n').filter((r: string) => r.trim()) } 
                      }
                    })}
                    rows={8}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                    placeholder="Abstract must be original and unpublished work&#10;Should not have been presented in any conference/CME earlier&#10;Maximum 200 words&#10;Upload as Word document (.doc or .docx)&#10;..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Each line becomes a bullet point in the guidelines</p>
                </div>
              </CardContent>
            </Card>

            {/* E-Poster Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-purple-600" />
                  E-Poster Guidelines
                </CardTitle>
                <CardDescription>Guidelines specific to E-Poster submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <Label className="font-semibold">Enable E-Poster Category</Label>
                    <p className="text-sm text-slate-500">Allow users to submit E-Posters</p>
                  </div>
                  <Switch
                    checked={config.guidelines?.poster?.enabled}
                    onCheckedChange={(checked) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines?.poster, enabled: checked } 
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Section Title</Label>
                  <Input
                    value={config.guidelines?.poster?.title || 'E-Poster Guidelines'}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines?.poster, title: e.target.value } 
                      }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Word Limit</Label>
                  <Input
                    type="number"
                    value={config.guidelines?.poster?.wordLimit || 200}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines?.poster, wordLimit: parseInt(e.target.value) } 
                      }
                    })}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Requirements (one per line)</Label>
                  <Textarea
                    value={config.guidelines?.poster?.requirements?.join('\n') || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      guidelines: { 
                        ...config.guidelines, 
                        poster: { ...config.guidelines?.poster, requirements: e.target.value.split('\n').filter((r: string) => r.trim()) } 
                      }
                    })}
                    rows={10}
                    className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                    placeholder="E-poster will be displayed on standard 42&quot; (Diagonal) LCD&#10;The entire poster must be 16:9 Ratio&#10;File format should be PowerPoint (.PPT)&#10;Total size should not exceed 5-10 MB&#10;..."
                  />
                  <p className="text-xs text-slate-500 mt-1">Each line becomes a bullet point in the guidelines</p>
                </div>
              </CardContent>
            </Card>

            {/* File Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  File Upload Settings
                </CardTitle>
                <CardDescription>Configure allowed file types and size limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Max File Size (MB)</Label>
                    <Input
                      type="number"
                      value={config.maxFileSizeMB || 10}
                      onChange={(e) => setConfig({
                        ...config,
                        maxFileSizeMB: parseInt(e.target.value)
                      })}
                      className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Reviewers Per Abstract</Label>
                    <Input
                      type="number"
                      value={config.reviewersPerAbstractDefault || 2}
                      onChange={(e) => setConfig({
                        ...config,
                        reviewersPerAbstractDefault: parseInt(e.target.value)
                      })}
                      className="mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Allowed file types:</strong><br/>
                    • Initial submission: Word documents (.doc, .docx)<br/>
                    • Final presentation: PowerPoint (.ppt, .pptx)
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Ready to save changes?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">These settings will be reflected on the public abstracts page</p>
            </div>
            <Button onClick={saveConfig} disabled={saving} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
