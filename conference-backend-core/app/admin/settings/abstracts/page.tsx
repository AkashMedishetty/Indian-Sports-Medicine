"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Switch } from '@/conference-backend-core/components/ui/switch'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Separator } from '@/conference-backend-core/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/conference-backend-core/components/ui/tabs'
import { 
  ArrowLeft, Save, Loader2, Mail, FileText, Upload, 
  Download, Trash2, Settings, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

interface TrackTemplate {
  trackKey: string
  trackLabel: string
  initialTemplateUrl?: string
  initialTemplateFileName?: string
  finalTemplateUrl?: string
  finalTemplateFileName?: string
}

interface AbstractsConfig {
  isEnabled: boolean
  submissionOpenDate: string
  submissionCloseDate: string
  finalSubmissionOpenDate?: string
  finalSubmissionCloseDate?: string
  guidelines: {
    general: string
    freePaper: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
    poster: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
    finalSubmission: {
      enabled: boolean
      title: string
      instructions: string
      requirements: string[]
      deadline?: string
    }
  }
  fileRequirements: {
    maxSizeKB: number
    allowedFormats: string[]
    templateUrl?: string
    templateFileName?: string
    finalTemplateUrl?: string
    finalTemplateFileName?: string
    trackTemplates?: TrackTemplate[]
  }
  emailTemplates: {
    acceptance: { enabled: boolean; subject: string; body: string }
    rejection: { enabled: boolean; subject: string; body: string }
    finalSubmissionReminder: { enabled: boolean; subject: string; body: string }
  }
}

const defaultConfig: AbstractsConfig = {
  isEnabled: true,
  submissionOpenDate: '',
  submissionCloseDate: '',
  guidelines: {
    general: '',
    freePaper: { enabled: true, title: 'Free Paper', wordLimit: 250, requirements: [], format: '' },
    poster: { enabled: true, title: 'Poster', wordLimit: 250, requirements: [], format: '' },
    finalSubmission: { enabled: true, title: 'Final Submission', instructions: '', requirements: [], deadline: '' }
  },
  fileRequirements: { 
    maxSizeKB: 5120, 
    allowedFormats: ['.doc', '.docx', '.pdf'],
    trackTemplates: []
  },
  emailTemplates: {
    acceptance: { enabled: true, subject: '', body: '' },
    rejection: { enabled: true, subject: '', body: '' },
    finalSubmissionReminder: { enabled: true, subject: '', body: '' }
  }
}

export default function AbstractsSettingsPage() {
  const router = useRouter()
  const [config, setConfig] = useState<AbstractsConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)
  const finalTemplateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/config')
      const data = await response.json()
      if (data.success && data.data) {
        setConfig({ ...defaultConfig, ...data.data })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/abstracts/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.message || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'initial' | 'final') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(type)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/abstracts/upload-template', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        if (type === 'initial') {
          setConfig(prev => ({
            ...prev,
            fileRequirements: {
              ...prev.fileRequirements,
              templateUrl: data.url,
              templateFileName: file.name
            }
          }))
        } else {
          setConfig(prev => ({
            ...prev,
            fileRequirements: {
              ...prev.fileRequirements,
              finalTemplateUrl: data.url,
              finalTemplateFileName: file.name
            }
          }))
        }
        toast.success('Template uploaded successfully')
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      toast.error('Failed to upload template')
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  const removeTemplate = (type: 'initial' | 'final') => {
    if (type === 'initial') {
      setConfig(prev => ({
        ...prev,
        fileRequirements: { ...prev.fileRequirements, templateUrl: undefined, templateFileName: undefined }
      }))
    } else {
      setConfig(prev => ({
        ...prev,
        fileRequirements: { ...prev.fileRequirements, finalTemplateUrl: undefined, finalTemplateFileName: undefined }
      }))
    }
  }

  const updateGuideline = (type: 'freePaper' | 'poster' | 'finalSubmission', field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      guidelines: {
        ...prev.guidelines,
        [type]: { ...prev.guidelines[type], [field]: value }
      }
    }))
  }

  const updateEmailTemplate = (type: 'acceptance' | 'rejection' | 'finalSubmissionReminder', field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [type]: { ...prev.emailTemplates[type], [field]: value }
      }
    }))
  }

  // Get tracks from conference config
  const tracks = conferenceConfig.abstracts?.tracks?.filter(t => t.enabled) || []

  // Initialize track templates if not present
  const getTrackTemplates = (): TrackTemplate[] => {
    const existing = config.fileRequirements.trackTemplates || []
    return tracks.map(track => {
      const found = existing.find(t => t.trackKey === track.key)
      return found || {
        trackKey: track.key,
        trackLabel: track.label,
        initialTemplateUrl: undefined,
        initialTemplateFileName: undefined,
        finalTemplateUrl: undefined,
        finalTemplateFileName: undefined
      }
    })
  }

  // Handle track template upload
  const handleTrackTemplateUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    trackKey: string, 
    templateType: 'initial' | 'final'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(`${trackKey}-${templateType}`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', templateType)
      formData.append('trackKey', trackKey)

      const response = await fetch('/api/admin/abstracts/upload-template', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setConfig(prev => {
          const trackTemplates = getTrackTemplates()
          const updatedTemplates = trackTemplates.map(t => {
            if (t.trackKey === trackKey) {
              if (templateType === 'initial') {
                return { ...t, initialTemplateUrl: data.url, initialTemplateFileName: file.name }
              } else {
                return { ...t, finalTemplateUrl: data.url, finalTemplateFileName: file.name }
              }
            }
            return t
          })
          return {
            ...prev,
            fileRequirements: {
              ...prev.fileRequirements,
              trackTemplates: updatedTemplates
            }
          }
        })
        toast.success(`Template uploaded for ${tracks.find(t => t.key === trackKey)?.label || trackKey}`)
      } else {
        toast.error(data.message || 'Upload failed')
      }
    } catch (error) {
      toast.error('Failed to upload template')
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  // Remove track template
  const removeTrackTemplate = (trackKey: string, templateType: 'initial' | 'final') => {
    setConfig(prev => {
      const trackTemplates = getTrackTemplates()
      const updatedTemplates = trackTemplates.map(t => {
        if (t.trackKey === trackKey) {
          if (templateType === 'initial') {
            return { ...t, initialTemplateUrl: undefined, initialTemplateFileName: undefined }
          } else {
            return { ...t, finalTemplateUrl: undefined, finalTemplateFileName: undefined }
          }
        }
        return t
      })
      return {
        ...prev,
        fileRequirements: {
          ...prev.fileRequirements,
          trackTemplates: updatedTemplates
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Abstracts Settings</h1>
              <p className="text-gray-500">Configure abstract submissions, guidelines, and email templates</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general"><Settings className="w-4 h-4 mr-2" />General</TabsTrigger>
            <TabsTrigger value="guidelines"><BookOpen className="w-4 h-4 mr-2" />Guidelines</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Templates</TabsTrigger>
            <TabsTrigger value="emails"><Mail className="w-4 h-4 mr-2" />Emails</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission Settings</CardTitle>
                <CardDescription>Configure abstract submission windows and basic settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Abstract Submissions</Label>
                    <p className="text-sm text-gray-500">Allow users to submit abstracts</p>
                  </div>
                  <Switch
                    checked={config.isEnabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isEnabled: checked }))}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Initial Submission Opens</Label>
                    <Input
                      type="datetime-local"
                      value={config.submissionOpenDate ? new Date(config.submissionOpenDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, submissionOpenDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Initial Submission Closes</Label>
                    <Input
                      type="datetime-local"
                      value={config.submissionCloseDate ? new Date(config.submissionCloseDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, submissionCloseDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Final Submission Opens</Label>
                    <Input
                      type="datetime-local"
                      value={config.finalSubmissionOpenDate ? new Date(config.finalSubmissionOpenDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, finalSubmissionOpenDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Final Submission Closes</Label>
                    <Input
                      type="datetime-local"
                      value={config.finalSubmissionCloseDate ? new Date(config.finalSubmissionCloseDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, finalSubmissionCloseDate: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max File Size (KB)</Label>
                    <Input
                      type="number"
                      value={config.fileRequirements.maxSizeKB}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        fileRequirements: { ...prev.fileRequirements, maxSizeKB: parseInt(e.target.value) || 5120 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Allowed Formats (comma separated)</Label>
                    <Input
                      value={config.fileRequirements.allowedFormats.join(', ')}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        fileRequirements: { ...prev.fileRequirements, allowedFormats: e.target.value.split(',').map(f => f.trim()) }
                      }))}
                      placeholder=".doc, .docx, .pdf"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guidelines */}
          <TabsContent value="guidelines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.guidelines.general}
                  onChange={(e) => setConfig(prev => ({ ...prev, guidelines: { ...prev.guidelines, general: e.target.value } }))}
                  placeholder="Enter general guidelines for abstract submission..."
                  rows={6}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Final Submission Guidelines</CardTitle>
                <CardDescription>Instructions shown to users after their abstract is accepted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Final Submission</Label>
                  <Switch
                    checked={config.guidelines.finalSubmission.enabled}
                    onCheckedChange={(checked) => updateGuideline('finalSubmission', 'enabled', checked)}
                  />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={config.guidelines.finalSubmission.title}
                    onChange={(e) => updateGuideline('finalSubmission', 'title', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    value={config.guidelines.finalSubmission.instructions}
                    onChange={(e) => updateGuideline('finalSubmission', 'instructions', e.target.value)}
                    rows={6}
                    placeholder="Enter detailed instructions for final submission..."
                  />
                </div>
                <div>
                  <Label>Requirements (one per line)</Label>
                  <Textarea
                    value={config.guidelines.finalSubmission.requirements.join('\n')}
                    onChange={(e) => updateGuideline('finalSubmission', 'requirements', e.target.value.split('\n').filter(r => r.trim()))}
                    rows={4}
                    placeholder="- Requirement 1&#10;- Requirement 2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Free Paper Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Free Paper</Label>
                  <Switch
                    checked={config.guidelines.freePaper.enabled}
                    onCheckedChange={(checked) => updateGuideline('freePaper', 'enabled', checked)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={config.guidelines.freePaper.title}
                      onChange={(e) => updateGuideline('freePaper', 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Word Limit</Label>
                    <Input
                      type="number"
                      value={config.guidelines.freePaper.wordLimit}
                      onChange={(e) => updateGuideline('freePaper', 'wordLimit', parseInt(e.target.value) || 250)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Format Instructions</Label>
                  <Textarea
                    value={config.guidelines.freePaper.format}
                    onChange={(e) => updateGuideline('freePaper', 'format', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Poster Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Poster</Label>
                  <Switch
                    checked={config.guidelines.poster.enabled}
                    onCheckedChange={(checked) => updateGuideline('poster', 'enabled', checked)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={config.guidelines.poster.title}
                      onChange={(e) => updateGuideline('poster', 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Word Limit</Label>
                    <Input
                      type="number"
                      value={config.guidelines.poster.wordLimit}
                      onChange={(e) => updateGuideline('poster', 'wordLimit', parseInt(e.target.value) || 250)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Format Instructions</Label>
                  <Textarea
                    value={config.guidelines.poster.format}
                    onChange={(e) => updateGuideline('poster', 'format', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-6">
            {/* Default Templates (fallback) */}
            <Card>
              <CardHeader>
                <CardTitle>Default Templates</CardTitle>
                <CardDescription>These templates are used when no track-specific template is available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Default Initial Template */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Initial Submission Template</Label>
                    {config.fileRequirements.templateUrl ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          <span className="text-sm truncate max-w-[150px]">{config.fileRequirements.templateFileName || 'Template'}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={config.fileRequirements.templateUrl} download><Download className="w-4 h-4" /></a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeTemplate('initial')}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input ref={templateInputRef} type="file" accept=".doc,.docx,.pdf,.ppt,.pptx" onChange={(e) => handleTemplateUpload(e, 'initial')} className="hidden" />
                        <Button variant="outline" size="sm" onClick={() => templateInputRef.current?.click()} disabled={uploading === 'initial'}>
                          {uploading === 'initial' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Default Final Template */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Final Submission Template</Label>
                    {config.fileRequirements.finalTemplateUrl ? (
                      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <span className="text-sm truncate max-w-[150px]">{config.fileRequirements.finalTemplateFileName || 'Template'}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={config.fileRequirements.finalTemplateUrl} download><Download className="w-4 h-4" /></a>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeTemplate('final')}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input ref={finalTemplateInputRef} type="file" accept=".doc,.docx,.pdf,.ppt,.pptx" onChange={(e) => handleTemplateUpload(e, 'final')} className="hidden" />
                        <Button variant="outline" size="sm" onClick={() => finalTemplateInputRef.current?.click()} disabled={uploading === 'final'}>
                          {uploading === 'final' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Per-Track Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Templates by Submission Type</CardTitle>
                <CardDescription>Upload specific templates for each submission type (Free Paper, Poster, E-Poster, etc.)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tracks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No submission types configured.</p>
                    <p className="text-sm">Configure tracks in conference.config.ts</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getTrackTemplates().map((trackTemplate) => {
                      const track = tracks.find(t => t.key === trackTemplate.trackKey)
                      if (!track) return null
                      
                      return (
                        <div key={trackTemplate.trackKey} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{track.label}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Initial Template for this track */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">Initial Submission</Label>
                              {trackTemplate.initialTemplateUrl ? (
                                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs truncate max-w-[120px]">{trackTemplate.initialTemplateFileName}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                      <a href={trackTemplate.initialTemplateUrl} download><Download className="w-3 h-3" /></a>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTrackTemplate(trackTemplate.trackKey, 'initial')}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="border border-dashed border-gray-300 rounded p-2 text-center">
                                  <input
                                    type="file"
                                    id={`initial-${trackTemplate.trackKey}`}
                                    accept=".doc,.docx,.pdf,.ppt,.pptx"
                                    onChange={(e) => handleTrackTemplateUpload(e, trackTemplate.trackKey, 'initial')}
                                    className="hidden"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => document.getElementById(`initial-${trackTemplate.trackKey}`)?.click()}
                                    disabled={uploading === `${trackTemplate.trackKey}-initial`}
                                  >
                                    {uploading === `${trackTemplate.trackKey}-initial` ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Upload className="w-3 h-3 mr-1" />
                                    )}
                                    Upload
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Final Template for this track */}
                            <div>
                              <Label className="text-xs text-gray-500 mb-1 block">Final Submission</Label>
                              {trackTemplate.finalTemplateUrl ? (
                                <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs truncate max-w-[120px]">{trackTemplate.finalTemplateFileName}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                      <a href={trackTemplate.finalTemplateUrl} download><Download className="w-3 h-3" /></a>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTrackTemplate(trackTemplate.trackKey, 'final')}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="border border-dashed border-gray-300 rounded p-2 text-center">
                                  <input
                                    type="file"
                                    id={`final-${trackTemplate.trackKey}`}
                                    accept=".doc,.docx,.pdf,.ppt,.pptx"
                                    onChange={(e) => handleTrackTemplateUpload(e, trackTemplate.trackKey, 'final')}
                                    className="hidden"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => document.getElementById(`final-${trackTemplate.trackKey}`)?.click()}
                                    disabled={uploading === `${trackTemplate.trackKey}-final`}
                                  >
                                    {uploading === `${trackTemplate.trackKey}-final` ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Upload className="w-3 h-3 mr-1" />
                                    )}
                                    Upload
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates */}
          <TabsContent value="emails" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Acceptance</Badge>
                  Email Template
                </CardTitle>
                <CardDescription>
                  Sent when an abstract is accepted. Placeholders: {'{name}'}, {'{title}'}, {'{abstractId}'}, {'{approvedFor}'}, {'{dashboardUrl}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Acceptance Email</Label>
                  <Switch
                    checked={config.emailTemplates.acceptance.enabled}
                    onCheckedChange={(checked) => updateEmailTemplate('acceptance', 'enabled', checked)}
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={config.emailTemplates.acceptance.subject}
                    onChange={(e) => updateEmailTemplate('acceptance', 'subject', e.target.value)}
                    placeholder="Congratulations! Your Abstract Has Been Accepted"
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={config.emailTemplates.acceptance.body}
                    onChange={(e) => updateEmailTemplate('acceptance', 'body', e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Rejection</Badge>
                  Email Template
                </CardTitle>
                <CardDescription>
                  Sent when an abstract is rejected. Placeholders: {'{name}'}, {'{title}'}, {'{abstractId}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Rejection Email</Label>
                  <Switch
                    checked={config.emailTemplates.rejection.enabled}
                    onCheckedChange={(checked) => updateEmailTemplate('rejection', 'enabled', checked)}
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={config.emailTemplates.rejection.subject}
                    onChange={(e) => updateEmailTemplate('rejection', 'subject', e.target.value)}
                    placeholder="Abstract Review Decision"
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={config.emailTemplates.rejection.body}
                    onChange={(e) => updateEmailTemplate('rejection', 'body', e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800">Reminder</Badge>
                  Final Submission Reminder
                </CardTitle>
                <CardDescription>
                  Sent to remind users to submit their final presentation. Placeholders: {'{name}'}, {'{title}'}, {'{abstractId}'}, {'{dashboardUrl}'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reminder Email</Label>
                  <Switch
                    checked={config.emailTemplates.finalSubmissionReminder.enabled}
                    onCheckedChange={(checked) => updateEmailTemplate('finalSubmissionReminder', 'enabled', checked)}
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={config.emailTemplates.finalSubmissionReminder.subject}
                    onChange={(e) => updateEmailTemplate('finalSubmissionReminder', 'subject', e.target.value)}
                    placeholder="Reminder: Final Presentation Submission Deadline"
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    value={config.emailTemplates.finalSubmissionReminder.body}
                    onChange={(e) => updateEmailTemplate('finalSubmissionReminder', 'body', e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
