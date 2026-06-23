'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { useToast } from '../ui/use-toast'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import {
  Upload, Save, Eye, Download, QrCode, Image as ImageIcon,
  Move, Trash2, Plus, RefreshCw
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

interface BadgeElement {
  id: string
  type: 'text' | 'image' | 'qr'
  label: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  color?: string
  content?: string
}

export function BadgeDesigner() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [config, setConfig] = useState({
    enabled: true,
    templateUrl: '',
    layout: 'portrait' as 'portrait' | 'landscape',
    size: 'A6' as 'A4' | 'A5' | 'A6',
    backgroundColor: '#ffffff'
  })

  const [templateDimensions, setTemplateDimensions] = useState({ width: 600, height: 800 })

  const [elements, setElements] = useState<BadgeElement[]>([
    {
      id: 'name',
      type: 'text',
      label: 'Name',
      x: 20,
      y: 100,
      width: 260,
      height: 50,
      fontSize: 20,
      fontFamily: 'Arial',
      color: '#000000',
      content: '{name}'
    },
    {
      id: 'regId',
      type: 'text',
      label: 'Registration ID',
      x: 50,
      y: 150,
      width: 150,
      height: 30,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#666666',
      content: '{registrationId}'
    },
    {
      id: 'qr',
      type: 'qr',
      label: 'QR Code',
      x: 200,
      y: 200,
      width: 100,
      height: 100
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
      const response = await fetch('/api/admin/config/badge')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setConfig({
            enabled: result.data.enabled,
            templateUrl: result.data.template?.logoUrl || '',
            layout: result.data.template?.layout || 'portrait',
            size: result.data.template?.size || 'A6',
            backgroundColor: result.data.template?.backgroundColor || '#ffffff'
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
          } else if (result.data.template?.logoUrl) {
            // If dimensions not saved but image exists, load image to get dimensions
            const img = new Image()
            img.onload = () => {
              setTemplateDimensions({ width: img.width, height: img.height })
            }
            img.src = result.data.template.logoUrl
          }
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        title: "Error",
        description: "Failed to load badge configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, JPEG)",
        variant: "destructive"
      })
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'badge-template')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        // API returns result.url directly, not result.data.url
        if (result.success && result.url) {
          setConfig(prev => ({ ...prev, templateUrl: result.url }))
          
          // Load image to get actual dimensions
          const img = new Image()
          img.onload = () => {
            setTemplateDimensions({ width: img.width, height: img.height })
          }
          img.src = result.url
          
          toast({
            title: "Template Uploaded",
            description: "Badge template uploaded successfully. Position your elements on the template."
          })
        } else {
          throw new Error(result.message || 'Upload failed')
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload template. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleElementDrag = (elementId: string, deltaX: number, deltaY: number) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, x: el.x + deltaX, y: el.y + deltaY }
        : el
    ))
  }

  const addElement = (type: 'text' | 'qr') => {
    const newElement: BadgeElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: type === 'text' ? 'New Text' : 'QR Code',
      x: 50,
      y: 50,
      width: type === 'text' ? 150 : 100,
      height: type === 'text' ? 30 : 100,
      fontSize: type === 'text' ? 16 : undefined,
      fontFamily: 'Arial',
      color: '#000000',
      content: type === 'text' ? '{text}' : undefined
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

  const updateElement = (elementId: string, updates: Partial<BadgeElement>) => {
    setElements(prev => prev.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    ))
  }

  const saveConfiguration = async () => {
    try {
      setSaving(true)
      
      const configData = {
        enabled: config.enabled,
        template: {
          layout: config.layout,
          size: config.size,
          backgroundColor: config.backgroundColor,
          logoUrl: config.templateUrl,
          showQRCode: elements.some(el => el.type === 'qr'),
          showPhoto: false,
          width: templateDimensions.width,
          height: templateDimensions.height
        },
        elements: elements,
        fields: {
          name: elements.some(el => el.content?.includes('{name}')),
          registrationId: elements.some(el => el.content?.includes('{registrationId}')),
          institution: elements.some(el => el.content?.includes('{institution}')),
          category: elements.some(el => el.content?.includes('{category}')),
          city: elements.some(el => el.content?.includes('{city}')),
          country: elements.some(el => el.content?.includes('{country}'))
        },
        styling: {
          fontFamily: 'Arial',
          primaryColor: conferenceConfig.theme.primary,
          secondaryColor: conferenceConfig.theme.secondary,
          borderColor: '#e5e7eb'
        }
      }

      const response = await fetch('/api/admin/config/badge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })

      if (response.ok) {
        toast({
          title: "Configuration Saved",
          description: "Badge design saved successfully"
        })
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save badge configuration",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const previewBadge = () => {
    window.open('/api/admin/badge/preview', '_blank')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin" style={{ color: conferenceConfig.theme.primary }} />
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedEl = elements.find(el => el.id === selectedElement)

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <ImageIcon className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
                Badge Designer
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Design badges with drag-drop positioning
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
              <Label className="text-slate-900 dark:text-white">
                {config.enabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="design" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Design Tab */}
            <TabsContent value="design" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Canvas */}
                <div className="lg:col-span-2">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div 
                      ref={canvasRef}
                      className="relative mx-auto rounded-lg shadow-xl overflow-hidden"
                      style={{
                        width: `${templateDimensions.width}px`,
                        height: `${templateDimensions.height}px`,
                        maxWidth: '100%',
                        backgroundColor: config.backgroundColor,
                        backgroundImage: config.templateUrl ? `url(${config.templateUrl})` : 'none',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                      onMouseMove={(e) => {
                        if (dragging && dragStart && dragElementId) {
                          const deltaX = e.clientX - dragStart.x
                          const deltaY = e.clientY - dragStart.y
                          
                          setElements(prev => prev.map(el => 
                            el.id === dragElementId 
                              ? { ...el, x: Math.max(0, el.x + deltaX), y: Math.max(0, el.y + deltaY) }
                              : el
                          ))
                          
                          setDragStart({ x: e.clientX, y: e.clientY })
                        }
                        
                        // Handle resizing
                        if (resizing && resizeStart && resizeElementId) {
                          const deltaX = e.clientX - resizeStart.x
                          const deltaY = e.clientY - resizeStart.y
                          
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
                            left: `${element.x}px`,
                            top: `${element.y}px`,
                            width: `${element.width}px`,
                            height: `${element.height}px`,
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
                          {/* Resize Handle - Bottom Right Corner */}
                          {selectedElement === element.id && element.type === 'text' && (
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
                          {element.type === 'text' && (
                            <div 
                              className="flex items-center justify-center h-full p-2 pointer-events-none"
                              style={{
                                fontSize: `${element.fontSize}px`,
                                fontFamily: element.fontFamily,
                                color: element.color,
                                fontWeight: 'bold',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                overflow: 'hidden',
                                textAlign: 'center',
                                lineHeight: '1.2'
                              }}
                            >
                              {element.content?.replace('{name}', 'Dr. Sample Name')
                                .replace('{registrationId}', 'NV2026-001')
                                .replace('{institution}', 'Sample Hospital')
                                .replace('{category}', 'CVSI Member')
                              }
                            </div>
                          )}
                          {element.type === 'qr' && (
                            <div className="flex items-center justify-center h-full bg-white p-2 pointer-events-none">
                              <QrCode className="w-full h-full text-black" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                      Click elements to select • Drag to move • Drag corner handle to resize
                    </p>
                  </div>
                </div>

                {/* Element Properties */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                      {selectedEl ? `Edit ${selectedEl.label}` : 'Select an element'}
                    </h3>
                    
                    {selectedEl && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-slate-900 dark:text-white">Label</Label>
                          <Input
                            value={selectedEl.label}
                            onChange={(e) => updateElement(selectedEl.id, { label: e.target.value })}
                            className="mt-1"
                          />
                        </div>

                        {selectedEl.type === 'text' && (
                          <>
                            <div>
                              <Label className="text-slate-900 dark:text-white">Content</Label>
                              <Input
                                value={selectedEl.content}
                                onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                                className="mt-1"
                                placeholder="{name}, {registrationId}, etc."
                              />
                              <p className="text-xs text-slate-500 mt-1">Text will wrap automatically within the box</p>
                            </div>
                            <div>
                              <Label className="text-slate-900 dark:text-white">Font Size</Label>
                              <Input
                                type="number"
                                value={selectedEl.fontSize}
                                onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-900 dark:text-white">Color</Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  type="color"
                                  value={selectedEl.color}
                                  onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                                  className="w-16"
                                />
                                <Input
                                  type="text"
                                  value={selectedEl.color}
                                  onChange={(e) => updateElement(selectedEl.id, { color: e.target.value })}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-slate-900 dark:text-white">X</Label>
                            <Input
                              type="number"
                              value={selectedEl.x}
                              onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-900 dark:text-white">Y</Label>
                            <Input
                              type="number"
                              value={selectedEl.y}
                              onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-slate-900 dark:text-white">Width</Label>
                            <Input
                              type="number"
                              value={selectedEl.width}
                              onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-slate-900 dark:text-white">Height</Label>
                            <Input
                              type="number"
                              value={selectedEl.height}
                              onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) })}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteElement(selectedEl.id)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Element
                        </Button>
                      </div>
                    )}

                    {!selectedEl && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                        Click an element on the canvas to edit its properties
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Elements Tab */}
            <TabsContent value="elements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => addElement('text')}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <Plus className="h-6 w-6" />
                  <span>Add Text Element</span>
                </Button>
                <Button
                  onClick={() => addElement('qr')}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <QrCode className="h-6 w-6" />
                  <span>Add QR Code</span>
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
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {element.type === 'text' ? element.content : 'QR Code'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteElement(element.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Available Variables</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{'{name}'}</code>
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{'{registrationId}'}</code>
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{'{institution}'}</code>
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{'{category}'}</code>
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{'{city}'}</code>
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{'{country}'}</code>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-900 dark:text-white">Template Upload</Label>
                  <div className="mt-2 flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTemplateUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="flex-1"
                    >
                      {uploading ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" /> Upload Template</>
                      )}
                    </Button>
                  </div>
                  {config.templateUrl && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ Template uploaded
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-slate-900 dark:text-white">Layout</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={config.layout === 'portrait' ? 'default' : 'outline'}
                      onClick={() => setConfig(prev => ({ ...prev, layout: 'portrait' }))}
                      className="flex-1"
                    >
                      Portrait
                    </Button>
                    <Button
                      variant={config.layout === 'landscape' ? 'default' : 'outline'}
                      onClick={() => setConfig(prev => ({ ...prev, layout: 'landscape' }))}
                      className="flex-1"
                    >
                      Landscape
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-900 dark:text-white">Size</Label>
                  <div className="flex gap-2 mt-2">
                    {['A4', 'A5', 'A6'].map(size => (
                      <Button
                        key={size}
                        variant={config.size === size ? 'default' : 'outline'}
                        onClick={() => setConfig(prev => ({ ...prev, size: size as any }))}
                        className="flex-1"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-900 dark:text-white">Background Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              className="flex-1"
              onClick={previewBadge}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Badge
            </Button>
            <Button
              onClick={saveConfiguration}
              disabled={saving}
              className="flex-1"
              style={{ backgroundColor: conferenceConfig.theme.primary }}
            >
              {saving ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Configuration</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
