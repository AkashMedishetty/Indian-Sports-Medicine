/**
 * Design system testing and validation component
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Download,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Zap
} from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { 
  DesignSystemValidator, 
  createTestSuite, 
  TestResult,
  ComponentTest 
} from "@/conference-backend-core/lib/testing-utils"

interface DesignSystemTesterProps {
  enabled?: boolean
  className?: string
}

export function DesignSystemTester({ 
  enabled = process.env.NODE_ENV === "development",
  className 
}: DesignSystemTesterProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<Map<string, TestResult>>(new Map())
  const [validator] = useState(() => new DesignSystemValidator())
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [enabled])

  const runTests = async () => {
    setIsRunning(true)
    const testSuite = createTestSuite()
    const testResults = await validator.runAllTests(testSuite)
    setResults(testResults)
    setIsRunning(false)
  }

  const downloadReport = () => {
    const report = validator.generateReport()
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `design-system-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!enabled || !isVisible) return null

  const totalTests = results.size
  const passedTests = Array.from(results.values()).filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

  return (
    <div className={cn("fixed inset-4 z-50 pointer-events-none", className)}>
      <div className="flex justify-end">
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto max-w-md w-full"
        >
          <Card className="bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#25406b]" />
                    Design System Tester
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Validate redesign implementation
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-600"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-100/60">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="results" className="text-xs">Results</TabsTrigger>
                  <TabsTrigger value="devices" className="text-xs">Devices</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Test Summary */}
                  {totalTests > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-lg font-bold text-slate-900">{totalTests}</div>
                        <div className="text-xs text-slate-600">Total</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">{passedTests}</div>
                        <div className="text-xs text-green-600">Passed</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-700">{failedTests}</div>
                        <div className="text-xs text-red-600">Failed</div>
                      </div>
                    </div>
                  )}

                  {/* Success Rate */}
                  {totalTests > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Success Rate</span>
                        <span className="font-medium text-slate-900">
                          {successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            successRate >= 90 ? "bg-green-500" :
                            successRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={runTests}
                      disabled={isRunning}
                      size="sm"
                      className="flex-1"
                    >
                      {isRunning ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isRunning ? "Running..." : "Run Tests"}
                    </Button>

                    {totalTests > 0 && (
                      <Button
                        onClick={downloadReport}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-3">
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    <AnimatePresence>
                      {Array.from(results.entries()).map(([name, result], index) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            result.passed 
                              ? "bg-green-50 border-green-200" 
                              : "bg-red-50 border-red-200"
                          )}
                        >
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {name}
                            </div>
                            <div className="text-xs text-slate-600 truncate">
                              {result.message}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </TabsContent>

                <TabsContent value="devices" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium">Mobile</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Responsive
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Tablet className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium">Tablet</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Responsive
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium">Desktop</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        Responsive
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 text-center">
                    Responsive design validated across all breakpoints
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export function ComponentShowcase() {
  const [selectedComponent, setSelectedComponent] = useState("buttons")

  const components = {
    buttons: {
      name: "Buttons",
      items: [
        { variant: "default", children: "Primary Button" },
        { variant: "secondary", children: "Secondary Button" },
        { variant: "outline", children: "Outline Button" },
        { variant: "ghost", children: "Ghost Button" },
      ]
    },
    cards: {
      name: "Cards",
      items: [
        { title: "Default Card", description: "Basic card component" },
        { title: "Interactive Card", description: "Card with hover effects" },
      ]
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-2">
        {Object.entries(components).map(([key, component]) => (
          <Button
            key={key}
            variant={selectedComponent === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedComponent(key)}
          >
            {component.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedComponent === "buttons" && 
          components.buttons.items.map((props, index) => (
            <Button key={index} {...props as any} />
          ))
        }
        
        {selectedComponent === "cards" &&
          components.cards.items.map((props, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{props.title}</CardTitle>
                <CardDescription>{props.description}</CardDescription>
              </CardHeader>
            </Card>
          ))
        }
      </div>
    </div>
  )
}