'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/use-toast'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { Upload, Save, Eye, Award, Move, Trash2, Plus, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface CertificateElement {
  id: string
  type: 'text' | 'image' | 'variable'
  label: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  color?: string
  content?: string
  align?: 'left' | 'center' | 'right'
}

export function CertificateDesigner() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const [config, setConfig] = useState({
    enabled: true,
    backgroundImageUrl: '',
    logoUrl: '',
    signatureUrl: '',
    orientation: 'landscape' as 'portrait' | 'landscape',
    title: 'CERTIFICATE OF PARTICIPATION',
    bodyText: 'This is to certify that {name} has successfully participated in {conference}.',
    footerText: `© ${new Date().getFullYear()} ${conferenceConfig.shortName}`,
    issuedByName: 'Conference Chair',
    issuedByTitle: 'Organizer'
  })

  const [templateDimensions, setTemplateDimensions] = useState({ width: 1100, height: 850 })
  const [displayScale, setDisplayScale] = useState(1)

  const [elements, setElements] = useState<CertificateElement[]>([
    {
      id: 'name',
      type: 'variable',
      label: 'Participant Name',
      x: 300,
      y: 350,
      width: 500,
      height: 60,
      fontSize: 32,
      fontFamily: 'Georgia',
      color: '#000000',
      content: '{name}',
      align: 'center'
    },
    {
      id: 'title',
      type: 'text',
      label: 'Certificate Title',
      x: 200,
      y: 150,
      width: 700,
      height: 80,
      fontSize: 48,
      fontFamily: 'Georgia',
      color: '#1a1a1a',
      content: 'CERTIFICATE OF PARTICIPATION',
      align: 'center'
    }
  ])

  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)
  const [dragElementId, setDragElementId] = useState<string | null>(null)
  const [resizing, setResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [resizeElementId, setResizeElementId] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/certificate')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setConfig({
            enabled: result.data.enabled,
            backgroundImageUrl: result.data.template?.backgroundImageUrl || '',
            logoUrl: result.data.template?.logoUrl || '',
            signatureUrl: result.data.template?.signatureUrl || '',
            orientation: result.data.template?.orientation || 'landscape',
            title: result.data.content?.title || config.title,
            bodyText: result.data.content?.bodyText || config.bodyText,
            footerText: result.data.content?.footerText || config.footerText,
            issuedByName: result.data.content?.issuedByName || config.issuedByName,
            issuedByTitle: result.data.content?.issuedByTitle || config.issuedByTitle
          })
          
          // Load saved elements if they exist
          if (result.data.elements && result.data.elements.length > 0) {
            setElements(result.data.elements)
          }
          
          // Load template dimensions if saved
          if (result.data.template?.width && result.data.template?.height) {
            setTemplateDimensions({
              width: result.data.template.width,
              height: result.data.template.height
            })
          } else if (result.data.template?.backgroundImageUrl) {
            // If dimensions not saved but image exists, load image to get dimensions
            const img = new Image()
            img.onload = () => {
              const actualWidth = img.width
              const actualHeight = img.height
              setTemplateDimensions({ width: actualWidth, height: actualHeight })
              
              // Calculate display scale if image is too large
              const maxDisplayWidth = 1000
              if (actualWidth > maxDisplayWidth) {
                setDisplayScale(maxDisplayWidth / actualWidth)
              } else {
                setDisplayScale(1)
              }
            }
            img.src = result.data.template.backgroundImageUrl
          }
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load config", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'background' | 'logo' | 'signature') => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image", variant: "destructive" })
      return
    }
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', `certificate-${type}`)
      const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      
      if (response.ok) {
        const result = await response.json()
        
        // API returns result.url directly, not result.data.url
        if (result.success && result.url) {
          setConfig(prev => ({ 
            ...prev, 
            [`${type === 'background' ? 'backgroundImageUrl' : type + 'Url'}`]: result.url 
          }))
          
          // Load image dimensions for background
          if (type === 'background') {
            const img = new Image()
            img.onload = () => {
              const actualWidth = img.width
              const actualHeight = img.height
              
              // Set actual dimensions
              setTemplateDimensions({ width: actualWidth, height: actualHeight })
              
              // Auto-detect orientation
              const detectedOrientation = actualWidth > actualHeight ? 'landscape' : 'portrait'
              setConfig(prev => ({ ...prev, orientation: detectedOrientation }))
              
              // Calculate display scale if image is too large (max 1000px width)
              const maxDisplayWidth = 1000
              if (actualWidth > maxDisplayWidth) {
                setDisplayScale(maxDisplayWidth / actualWidth)
              } else {
                setDisplayScale(1)
              }
            }
            img.src = result.url
          }
          
          toast({ title: "Success", description: "File uploaded successfully" })
        } else {
          throw new Error(result.message || 'Upload failed')
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Failed to upload file",
        variant: "destructive" 
      })
    } finally {
      setUploading(false)
    }
  }

  const addElement = (type: 'text' | 'variable') => {
    const newElement: CertificateElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: type === 'text' ? 'New Text' : 'New Variable',
      x: 100,
      y: 100,
      width: type === 'text' ? 400 : 300,
      height: type === 'text' ? 50 : 40,
      fontSize: type === 'text' ? 24 : 28,
      fontFamily: 'Georgia',
      color: '#000000',
      content: type === 'text' ? 'Your text here' : '{name}',
      align: 'center'
    }
    setElements(prev => [...prev, newElement])
    setSelectedElement(newElement.id)
  }

  const deleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId))
    if (selectedElement === elementId) {
      setSelectedElement(null)
    }
  }

  const updateElement = (elementId: string, updates: Partial<CertificateElement>) => {
    setElements(prev => prev.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    ))
  }

  const saveConfiguration = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/config/certificate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          enabled: config.enabled, 
          template: { 
            orientation: config.orientation, 
            backgroundImageUrl: config.backgroundImageUrl, 
            logoUrl: config.logoUrl, 
            signatureUrl: config.signatureUrl,
            width: templateDimensions.width,
            height: templateDimensions.height
          }, 
          content: { 
            title: config.title, 
            bodyText: config.bodyText, 
            footerText: config.footerText, 
            issuedByName: config.issuedByName, 
            issuedByTitle: config.issuedByTitle 
          }, 
          elements 
        })
      })
      if (response.ok) {
        toast({ title: "Saved", description: "Configuration saved successfully" })
      }
    } catch (error) {
      toast({ title: "Save Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Card><CardContent className="p-12"><RefreshCw className="h-8 w-8 animate-spin mx-auto" style={{ color: conferenceConfig.theme.primary }} /></CardContent></Card>

  return (
    <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Award className="h-5 w-5" style={{ color: conferenceConfig.theme.accent }} />
              Certificate Designer
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Design certificates with template upload</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.enabled} onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))} />
            <Label className="text-slate-900 dark:text-white">{config.enabled ? 'Enabled' : 'Disabled'}</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="design">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="uploads">Templates</TabsTrigger>
          </TabsList>
          
          {/* Design Tab - Visual Editor */}
          <TabsContent value="design" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Visual Canvas */}
              <div className="lg:col-span-2">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div
                    ref={canvasRef}
                    className="relative mx-auto rounded-lg shadow-xl overflow-hidden bg-white"
                    style={{
                      width: `${templateDimensions.width * displayScale}px`,
                      height: `${templateDimensions.height * displayScale}px`,
                      backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : 'none',
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                    onMouseMove={(e) => {
                      if (dragging && dragStart && dragElementId) {
                        const deltaX = (e.clientX - dragStart.x) / displayScale
                        const deltaY = (e.clientY - dragStart.y) / displayScale
                        setElements(prev => prev.map(el =>
                          el.id === dragElementId
                            ? { ...el, x: Math.max(0, el.x + deltaX), y: Math.max(0, el.y + deltaY) }
                            : el
                        ))
                        setDragStart({ x: e.clientX, y: e.clientY })
                      }
                      if (resizing && resizeStart && resizeElementId) {
                        const deltaX = (e.clientX - resizeStart.x) / displayScale
                        const deltaY = (e.clientY - resizeStart.y) / displayScale
                        setElements(prev => prev.map(el =>
                          el.id === resizeElementId
                            ? {
                                ...el,
                                width: Math.max(50, resizeStart.width + deltaX),
                                height: Math.max(20, resizeStart.height + deltaY)
                              }
                            : el
                        ))
                      }
                    }}
                    onMouseUp={() => {
                      setDragging(false)
                      setDragStart(null)
                      setDragElementId(null)
                      setResizing(false)
                      setResizeStart(null)
                      setResizeElementId(null)
                    }}
                    onMouseLeave={() => {
                      setDragging(false)
                      setDragStart(null)
                      setDragElementId(null)
                      setResizing(false)
                      setResizeStart(null)
                      setResizeElementId(null)
                    }}
                  >
                    {/* Render Elements */}
                    {elements.map(element => (
                      <div
                        key={element.id}
                        className={`absolute cursor-move border-2 ${
                          selectedElement === element.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-transparent hover:border-blue-300'
                        }`}
                        style={{
                          left: `${element.x * displayScale}px`,
                          top: `${element.y * displayScale}px`,
                          width: `${element.width * displayScale}px`,
                          height: `${element.height * displayScale}px`,
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedElement(element.id)
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setDragElementId(element.id)
                          setDragStart({ x: e.clientX, y: e.clientY })
                          setDragging(true)
                          setSelectedElement(element.id)
                        }}
                      >
                        {/* Resize Handle */}
                        {selectedElement === element.id && (
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-nwse-resize border border-white"
                            style={{ transform: 'translate(50%, 50%)' }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setResizeElementId(element.id)
                              setResizeStart({
                                x: e.clientX,
                                y: e.clientY,
                                width: element.width,
                                height: element.height
                              })
                              setResizing(true)
                            }}
                          />
                        )}
                        {/* Element Content */}
                        <div
                          className="flex items-center justify-center h-full p-2 pointer-events-none"
                          style={{
                            fontSize: `${(element.fontSize || 16) * displayScale}px`,
                            fontFamily: element.fontFamily,
                            color: element.color,
                            fontWeight: 'bold',
                            textAlign: element.align,
                            lineHeight: '1.2'
                          }}
                        >
                          {element.content?.replace('{name}', 'John Doe')
                            .replace('{conference}', conferenceConfig.shortName)
                            .replace('{startDate}', 'Jan 15, 2026')
                            .replace('{endDate}', 'Jan 18, 2026')
                            .replace('{location}', 'Sample City')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                    Click elements to select • Drag to move • Drag corner to resize
                  </p>
                </div>
              </div>

              {/* Element Properties */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                    {elements.find(el => el.id === selectedElement)?.label || 'Select an element'}
                  </h3>
                  {selectedElement && elements.find(el => el.id === selectedElement) && (() => {
                    const el = elements.find(e => e.id === selectedElement)!
                    return (
                      <div className="space-y-3">
                        <div>
                          <Label>Label</Label>
                          <Input value={el.label} onChange={(e) => updateElement(el.id, { label: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                          <Label>Content</Label>
                          <Input value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} className="mt-1" placeholder="{name}, {conference}, etc." />
                          <p className="text-xs text-slate-500 mt-1">Use variables: {'{name}'}, {'{conference}'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Font Size</Label>
                            <Input type="number" value={el.fontSize} onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) })} className="mt-1" />
                          </div>
                          <div>
                            <Label>Color</Label>
                            <Input type="color" value={el.color} onChange={(e) => updateElement(el.id, { color: e.target.value })} className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <Label>Text Align</Label>
                          <div className="flex gap-2 mt-1">
                            {(['left', 'center', 'right'] as const).map(align => (
                              <Button
                                key={align}
                                size="sm"
                                variant={el.align === align ? 'default' : 'outline'}
                                onClick={() => updateElement(el.id, { align })}
                                className="flex-1 capitalize"
                              >
                                {align}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>X Position</Label>
                            <Input type="number" value={el.x} onChange={(e) => updateElement(el.id, { x: parseInt(e.target.value) })} className="mt-1" />
                          </div>
                          <div>
                            <Label>Y Position</Label>
                            <Input type="number" value={el.y} onChange={(e) => updateElement(el.id, { y: parseInt(e.target.value) })} className="mt-1" />
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => deleteElement(el.id)} className="w-full">
                          <Trash2 className="h-4 w-4 mr-2" />Delete Element
                        </Button>
                      </div>
                    )
                  })()}
                  {!selectedElement && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                      Click an element to edit
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Elements Tab */}
          <TabsContent value="elements" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => addElement('text')} className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
                <Plus className="h-6 w-6" />
                <span>Add Text Element</span>
              </Button>
              <Button onClick={() => addElement('variable')} className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
                <Plus className="h-6 w-6" />
                <span>Add Variable</span>
              </Button>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Current Elements</h3>
              <div className="space-y-2">
                {elements.map(element => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                      selectedElement === element.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Move className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{element.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{element.content}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteElement(element.id) }}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-semibold mb-2">Available Variables:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {['{name}', '{conference}', '{startDate}', '{endDate}', '{location}', '{registrationId}', '{institution}'].map(v => (
                  <code key={v} className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{v}</code>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Uploads Tab */}
          <TabsContent value="uploads" className="space-y-4 mt-4">
            <div>
              <Label>Background Certificate Template</Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'background')} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline" className="w-full mt-2">
                {uploading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Background</>}
              </Button>
              {config.backgroundImageUrl && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-green-600">✓ Uploaded</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {templateDimensions.width}×{templateDimensions.height}px ({config.orientation})
                    </p>
                  </div>
                  <img src={config.backgroundImageUrl} alt="Background" className="w-full rounded border" />
                </div>
              )}
            </div>
            <div>
              <Label>Logo (Optional)</Label>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')} className="hidden" />
              <Button onClick={() => logoInputRef.current?.click()} disabled={uploading} variant="outline" className="w-full mt-2">
                {uploading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Logo</>}
              </Button>
              {config.logoUrl && <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>}
            </div>
            <div>
              <Label>Signature (Optional)</Label>
              <input ref={signatureInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'signature')} className="hidden" />
              <Button onClick={() => signatureInputRef.current?.click()} disabled={uploading} variant="outline" className="w-full mt-2">
                {uploading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Signature</>}
              </Button>
              {config.signatureUrl && <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" className="flex-1" onClick={() => window.open('/api/admin/certificate/preview', '_blank')}>
            <Eye className="h-4 w-4 mr-2" />Preview
          </Button>
          <Button onClick={saveConfiguration} disabled={saving} className="flex-1" style={{ backgroundColor: conferenceConfig.theme.primary }}>
            {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
