"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  Calendar, Clock, MapPin, Users, Plus, Trash2, Save, Upload, 
  FileText, Settings as SettingsIcon, Download, Eye, Zap
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { conferenceConfig } from "@/config/conference.config"

interface Speaker {
  name: string
  designation?: string
  organization?: string
  photo?: string
}

interface Session {
  id: string
  title: string
  description?: string
  speakers: Speaker[]
  startTime: string
  endTime: string
  venue: string
  type: string
  tags?: string[]
  isBreak?: boolean
}

interface DayProgram {
  id: string
  date: string
  title: string
  description?: string
  sessions: Session[]
}

interface Venue {
  id: string
  name: string
  capacity?: number
  floor?: string
  description?: string
}

export function ProgramManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [config, setConfig] = useState<any>({
    isEnabled: false,
    mode: 'brochure-only',
    brochure: {
      enabled: false,
      title: 'Conference Program',
      description: ''
    },
    program: {
      enabled: false,
      title: 'Conference Program',
      days: [],
      venues: [],
      guidelines: []
    },
    settings: {
      showLiveIndicator: true,
      highlightCurrentSession: true,
      showSpeakerPhotos: true,
      allowDownload: true
    }
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/program/config')
      const data = await response.json()
      if (data.success) {
        setConfig(data.data)
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load program configuration", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/program/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Success", description: "Program configuration saved successfully" })
        setConfig(data.data)
      } else {
        toast({ title: "Error", description: data.message || "Failed to save", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const addDay = () => {
    const newDay: DayProgram = {
      id: Date.now().toString(),
      date: '',
      title: `Day ${config.program.days.length + 1}`,
      description: '',
      sessions: []
    }
    setConfig({
      ...config,
      program: {
        ...config.program,
        days: [...config.program.days, newDay]
      }
    })
  }

  const removeDay = (dayIndex: number) => {
    setConfig({
      ...config,
      program: {
        ...config.program,
        days: config.program.days.filter((_: any, i: number) => i !== dayIndex)
      }
    })
  }

  const addSession = (dayIndex: number) => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: '',
      description: '',
      speakers: [],
      startTime: '',
      endTime: '',
      venue: '',
      type: 'other',
      tags: [],
      isBreak: false
    }
    const updatedDays = [...config.program.days]
    updatedDays[dayIndex].sessions.push(newSession)
    setConfig({
      ...config,
      program: { ...config.program, days: updatedDays }
    })
  }

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    const updatedDays = [...config.program.days]
    updatedDays[dayIndex].sessions = updatedDays[dayIndex].sessions.filter((_: any, i: number) => i !== sessionIndex)
    setConfig({
      ...config,
      program: { ...config.program, days: updatedDays }
    })
  }

  const addSpeaker = (dayIndex: number, sessionIndex: number) => {
    const updatedDays = [...config.program.days]
    updatedDays[dayIndex].sessions[sessionIndex].speakers.push({
      name: '',
      designation: '',
      organization: ''
    })
    setConfig({
      ...config,
      program: { ...config.program, days: updatedDays }
    })
  }

  const addVenue = () => {
    const newVenue: Venue = {
      id: Date.now().toString(),
      name: '',
      capacity: 0,
      floor: '',
      description: ''
    }
    setConfig({
      ...config,
      program: {
        ...config.program,
        venues: [...config.program.venues, newVenue]
      }
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({ title: 'Error', description: 'Please upload a PDF file', variant: 'destructive' })
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 25MB', variant: 'destructive' })
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'program-brochure')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setConfig({
          ...config,
          brochure: {
            ...config.brochure,
            fileUrl: data.url,
            fileName: file.name,
            uploadedAt: new Date().toISOString()
          }
        })
        toast({ title: 'Success', description: 'Brochure uploaded successfully' })
      } else {
        toast({ title: 'Error', description: data.message || 'Upload failed', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' })
    } finally {
      setUploadingFile(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Program Configuration
          </CardTitle>
          <CardDescription>
            Manage conference program and schedule
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="brochure" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Brochure
          </TabsTrigger>
          <TabsTrigger value="program" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Full Program
          </TabsTrigger>
          <TabsTrigger value="venues" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <MapPin className="h-4 w-4 mr-2" />
            Venues
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                config.isEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}>
                <div>
                  <Label className="text-base font-semibold">Enable Program Page</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {config.isEnabled 
                      ? 'Program page is LIVE - Users can view the program' 
                      : 'Program page shows "Coming Soon"'}
                  </p>
                </div>
                <Switch
                  checked={config.isEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Display Mode</Label>
                <Select 
                  value={config.mode} 
                  onValueChange={(value) => setConfig({ ...config, mode: value })}
                >
                  <SelectTrigger className="mt-1 bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brochure-only">Brochure Only</SelectItem>
                    <SelectItem value="full-program">Full Program Schedule</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 mt-1">
                  Choose between showing a downloadable brochure or full interactive program
                </p>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Label className="text-base font-semibold">Display Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Live Indicator</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Display which session is currently happening</p>
                    </div>
                    <Switch
                      checked={config.settings.showLiveIndicator}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        settings: { ...config.settings, showLiveIndicator: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Highlight Current Session</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Emphasize the ongoing session</p>
                    </div>
                    <Switch
                      checked={config.settings.highlightCurrentSession}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        settings: { ...config.settings, highlightCurrentSession: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Speaker Photos</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Display speaker profile pictures</p>
                    </div>
                    <Switch
                      checked={config.settings.showSpeakerPhotos}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        settings: { ...config.settings, showSpeakerPhotos: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Download</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Let users download the program</p>
                    </div>
                    <Switch
                      checked={config.settings.allowDownload}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        settings: { ...config.settings, allowDownload: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brochure Tab */}
        <TabsContent value="brochure">
          <Card>
            <CardHeader>
              <CardTitle>Program Brochure</CardTitle>
              <CardDescription>Upload a PDF brochure for download</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Brochure Title</Label>
                <Input
                  value={config.brochure.title}
                  onChange={(e) => setConfig({
                    ...config,
                    brochure: { ...config.brochure, title: e.target.value }
                  })}
                  className="mt-1 bg-white dark:bg-slate-900"
                  placeholder="e.g., Conference Program 2026"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Description</Label>
                <Textarea
                  value={config.brochure.description || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    brochure: { ...config.brochure, description: e.target.value }
                  })}
                  className="mt-1 bg-white dark:bg-slate-900"
                  rows={3}
                  placeholder="Brief description of the program..."
                />
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Upload program brochure (PDF)
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Max file size: 25MB
                </p>
                <label htmlFor="brochure-upload">
                  <Button variant="outline" type="button" disabled={uploadingFile} asChild>
                    <span className="cursor-pointer">
                      {uploadingFile ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <input
                  id="brochure-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {config.brochure.fileUrl && (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{config.brochure.fileName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Uploaded {config.brochure.uploadedAt ? new Date(config.brochure.uploadedAt).toLocaleDateString() : 'recently'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full Program Tab */}
        <TabsContent value="program">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Full Program Schedule</CardTitle>
                  <CardDescription>Configure day-wise sessions and timings</CardDescription>
                </div>
                <Button onClick={addDay} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Day
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {config.program.days.map((day: DayProgram, dayIndex: number) => (
                <Card key={day.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 dark:text-slate-300">Day Title</Label>
                          <Input
                            value={day.title}
                            onChange={(e) => {
                              const updatedDays = [...config.program.days]
                              updatedDays[dayIndex].title = e.target.value
                              setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                            }}
                            className="mt-1 bg-white dark:bg-slate-900"
                            placeholder="e.g., Day 1 - Opening Session"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700 dark:text-slate-300">Date</Label>
                          <Input
                            type="date"
                            value={day.date}
                            onChange={(e) => {
                              const updatedDays = [...config.program.days]
                              updatedDays[dayIndex].date = e.target.value
                              setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                            }}
                            className="mt-1 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDay(dayIndex)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Sessions</Label>
                        <Button 
                          onClick={() => addSession(dayIndex)} 
                          size="sm" 
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Session
                        </Button>
                      </div>

                      {day.sessions.map((session: Session, sessionIndex: number) => (
                        <Card key={session.id} className="bg-slate-50 dark:bg-slate-900">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <Input
                                  value={session.title}
                                  onChange={(e) => {
                                    const updatedDays = [...config.program.days]
                                    updatedDays[dayIndex].sessions[sessionIndex].title = e.target.value
                                    setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                                  }}
                                  className="bg-white dark:bg-slate-800"
                                  placeholder="Session title"
                                />
                                <div className="grid grid-cols-3 gap-3">
                                  <Input
                                    type="time"
                                    value={session.startTime}
                                    onChange={(e) => {
                                      const updatedDays = [...config.program.days]
                                      updatedDays[dayIndex].sessions[sessionIndex].startTime = e.target.value
                                      setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                                    }}
                                    className="bg-white dark:bg-slate-800"
                                  />
                                  <Input
                                    type="time"
                                    value={session.endTime}
                                    onChange={(e) => {
                                      const updatedDays = [...config.program.days]
                                      updatedDays[dayIndex].sessions[sessionIndex].endTime = e.target.value
                                      setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                                    }}
                                    className="bg-white dark:bg-slate-800"
                                  />
                                  <Input
                                    value={session.venue}
                                    onChange={(e) => {
                                      const updatedDays = [...config.program.days]
                                      updatedDays[dayIndex].sessions[sessionIndex].venue = e.target.value
                                      setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                                    }}
                                    className="bg-white dark:bg-slate-800"
                                    placeholder="Venue"
                                  />
                                </div>
                                <Select
                                  value={session.type}
                                  onValueChange={(value) => {
                                    const updatedDays = [...config.program.days]
                                    updatedDays[dayIndex].sessions[sessionIndex].type = value
                                    setConfig({ ...config, program: { ...config.program, days: updatedDays } })
                                  }}
                                >
                                  <SelectTrigger className="bg-white dark:bg-slate-800">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="keynote">Keynote</SelectItem>
                                    <SelectItem value="panel">Panel Discussion</SelectItem>
                                    <SelectItem value="workshop">Workshop</SelectItem>
                                    <SelectItem value="paper-presentation">Paper Presentation</SelectItem>
                                    <SelectItem value="poster">Poster Session</SelectItem>
                                    <SelectItem value="break">Break</SelectItem>
                                    <SelectItem value="networking">Networking</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addSpeaker(dayIndex, sessionIndex)}
                                  className="w-full"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  Add Speaker
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSession(dayIndex, sessionIndex)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {config.program.days.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No days added yet. Click "Add Day" to start building your program.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Venues Tab */}
        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Venues</CardTitle>
                  <CardDescription>Manage conference venues and halls</CardDescription>
                </div>
                <Button onClick={addVenue} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Venue
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.program.venues.map((venue: Venue, index: number) => (
                <Card key={venue.id} className="bg-slate-50 dark:bg-slate-900">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={venue.name}
                        onChange={(e) => {
                          const updatedVenues = [...config.program.venues]
                          updatedVenues[index].name = e.target.value
                          setConfig({ ...config, program: { ...config.program, venues: updatedVenues } })
                        }}
                        placeholder="Venue name"
                        className="bg-white dark:bg-slate-800"
                      />
                      <Input
                        value={venue.floor || ''}
                        onChange={(e) => {
                          const updatedVenues = [...config.program.venues]
                          updatedVenues[index].floor = e.target.value
                          setConfig({ ...config, program: { ...config.program, venues: updatedVenues } })
                        }}
                        placeholder="Floor"
                        className="bg-white dark:bg-slate-800"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Ready to save changes?</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Changes will be reflected on the public program page
              </p>
            </div>
            <Button 
              onClick={saveConfig} 
              disabled={saving} 
              size="lg" 
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Program
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
