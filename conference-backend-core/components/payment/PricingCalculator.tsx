"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { 
  Calculator, 
  Users, 
  Tag,
  DollarSign,
  Info,
  CheckCircle,
  Plus,
  Minus
} from "lucide-react"

interface PricingData {
  registration_categories: {
    [key: string]: {
      amount: number
      currency: string
      label: string
    }
  }
  workshops: Array<{
    id: string
    name: string
    amount: number
  }>
}

interface AccompanyingPerson {
  name: string
  age: number
  relationship: string
}

export function PricingCalculator() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null)
  const [selectedType, setSelectedType] = useState("")
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])
  const [accompanyingPersons, setAccompanyingPersons] = useState<AccompanyingPerson[]>([])
  const [discountCode, setDiscountCode] = useState("")
  const [calculation, setCalculation] = useState({
    registrationFee: 0,
    gst: 0,
    workshopFees: 0,
    accompanyingPersonFees: 0,
    subtotal: 0,
    discount: 0,
    total: 0,
    currency: "INR"
  })

  useEffect(() => {
    fetchPricingData()
  }, [])

  useEffect(() => {
    if (pricingData && selectedType) {
      calculateTotal()
    }
  }, [pricingData, selectedType, selectedWorkshops, accompanyingPersons, discountCode])

  const fetchPricingData = async () => {
    try {
      const response = await fetch("/api/payment/pricing")
      const data = await response.json()
      
      if (data.success) {
        setPricingData(data.data)
        // Set default selection
        if (Object.keys(data.data.registration_categories).length > 0) {
          const firstType = Object.keys(data.data.registration_categories)[0]
          setSelectedType(firstType)
        }
      }
    } catch (error) {
      console.error("Failed to fetch pricing data:", error)
    }
  }

  const calculateTotal = () => {
    if (!pricingData || !selectedType) return

    const registrationCategory = pricingData.registration_categories[selectedType]
    if (!registrationCategory) return

    let registrationFee = registrationCategory.amount
    const currency = registrationCategory.currency

    // Calculate GST (18% on base registration amount only)
    const gst = Math.round(registrationFee * 18 / 100)

    // Calculate workshop fees
    let workshopFees = 0
    selectedWorkshops.forEach(workshopName => {
      const workshop = pricingData.workshops.find(w => w.name === workshopName)
      if (workshop) {
        workshopFees += workshop.amount
      }
    })

    // Calculate accompanying person fees
    const accompanyingPersonFees = accompanyingPersons.length * (pricingData.registration_categories.accompanying?.amount || 3000)

    const subtotal = registrationFee + gst + workshopFees + accompanyingPersonFees

    // Apply basic discount logic (this is a simplified version)
    let discount = 0
    if (discountCode.toLowerCase() === "early2026") {
      discount = Math.floor(subtotal * 0.10) // 10% early bird
    } else if (discountCode.toLowerCase() === "independence") {
      discount = Math.floor(subtotal * 0.15) // 15% independence day
    }

    const total = Math.max(0, subtotal - discount)

    setCalculation({
      registrationFee,
      gst,
      workshopFees,
      accompanyingPersonFees,
      subtotal,
      discount,
      total,
      currency
    })
  }

  const handleWorkshopToggle = (workshopName: string) => {
    setSelectedWorkshops(prev => 
      prev.includes(workshopName)
        ? prev.filter(w => w !== workshopName)
        : [...prev, workshopName]
    )
  }

  const addAccompanyingPerson = () => {
    setAccompanyingPersons(prev => [
      ...prev,
      { name: "", age: 0, relationship: "" }
    ])
  }

  const removeAccompanyingPerson = (index: number) => {
    setAccompanyingPersons(prev => prev.filter((_, i) => i !== index))
  }

  const updateAccompanyingPerson = (index: number, field: string, value: string | number) => {
    setAccompanyingPersons(prev => 
      prev.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `â‚¹${amount.toLocaleString()}`
  }

  if (!pricingData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#f0f3f8]0" />
            Pricing Calculator
          </CardTitle>
          <CardDescription>
            Calculate your conference fees based on registration type and add-ons
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Section */}
            <div className="space-y-6">
              {/* Registration Type */}
              <div className="space-y-2">
                <Label htmlFor="registrationType">Registration Category</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select registration type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(pricingData.registration_categories)
                      .filter(([key]) => key !== "accompanying")
                      .map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.label} - {formatCurrency(category.amount, category.currency)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Workshop Selections */}
              <div className="space-y-3">
                <Label>Workshop Selections (Optional)</Label>
                <div className="space-y-2">
                  {pricingData.workshops.map((workshop) => (
                    <div key={workshop.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={workshop.id}
                          checked={selectedWorkshops.includes(workshop.name)}
                          onChange={() => handleWorkshopToggle(workshop.name)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={workshop.id} className="text-sm font-medium cursor-pointer">
                          {workshop.name}
                        </label>
                      </div>
                      <Badge variant="secondary">
                        {formatCurrency(workshop.amount, calculation.currency)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accompanying Persons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Accompanying Persons
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAccompanyingPerson}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Person
                  </Button>
                </div>
                
                {accompanyingPersons.length === 0 ? (
                  <p className="text-sm text-gray-600">No accompanying persons added</p>
                ) : (
                  <div className="space-y-2">
                    {accompanyingPersons.map((person, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Input
                          placeholder="Name"
                          value={person.name}
                          onChange={(e) => updateAccompanyingPerson(index, "name", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Age"
                          value={person.age || ""}
                          onChange={(e) => updateAccompanyingPerson(index, "age", parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Input
                          placeholder="Relationship"
                          value={person.relationship}
                          onChange={(e) => updateAccompanyingPerson(index, "relationship", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAccompanyingPerson(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Code */}
              <div className="space-y-2">
                <Label htmlFor="discountCode" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Discount Code
                </Label>
                <Input
                  id="discountCode"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter discount code (e.g., EARLY2026, INDEPENDENCE)"
                />
                <div className="text-xs text-gray-500">
                  Try: EARLY2026 (10% off) or INDEPENDENCE (15% off)
                </div>
              </div>
            </div>

            {/* Calculation Results */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost Breakdown
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Registration Fee:</span>
                    <span>{formatCurrency(calculation.registrationFee, calculation.currency)}</span>
                  </div>
                  
                  {calculation.gst > 0 && (
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span>{formatCurrency(calculation.gst, calculation.currency)}</span>
                    </div>
                  )}
                  
                  {calculation.workshopFees > 0 && (
                    <div className="flex justify-between">
                      <span>Workshop Fees ({selectedWorkshops.length}):</span>
                      <span>{formatCurrency(calculation.workshopFees, calculation.currency)}</span>
                    </div>
                  )}
                  
                  {calculation.accompanyingPersonFees > 0 && (
                    <div className="flex justify-between">
                      <span>Accompanying Persons ({accompanyingPersons.length}):</span>
                      <span>{formatCurrency(calculation.accompanyingPersonFees, calculation.currency)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculation.subtotal, calculation.currency)}</span>
                  </div>
                  
                  {calculation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount Applied:</span>
                      <span>-{formatCurrency(calculation.discount, calculation.currency)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculation.total, calculation.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Active Discounts Info */}
              <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg">
                <h4 className="font-semibold text-primary dark:text-primary/90 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Available Discounts
                </h4>
                <div className="space-y-1 text-sm text-primary/80 dark:text-primary/70">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Early Bird: 10% off (Code: EARLY2026)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Independence Day Special: 15% off (Code: INDEPENDENCE)</span>
                  </div>
                </div>
              </div>

              {/* Registration Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>â€¢ Registration fees include access to all conference sessions</p>
                <p>â€¢ Workshop fees are additional and optional</p>
                <p>â€¢ Accompanying person fees include meals and social events</p>
                <p>â€¢ All prices are inclusive of applicable taxes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}