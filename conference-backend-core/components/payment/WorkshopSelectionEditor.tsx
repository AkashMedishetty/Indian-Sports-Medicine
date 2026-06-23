"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Checkbox } from "@/conference-backend-core/components/ui/checkbox"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Loader2, Info, Save } from "lucide-react"

interface WorkshopApiItem {
  id: string
  name?: string
  label?: string
  amount?: number
  price?: number
  maxSeats: number
  bookedSeats: number
  availableSeats: number
  canRegister: boolean
}

interface WorkshopSelectionEditorProps {
  initialSelections: string[]
  onUpdated: (newSelections: string[]) => void
  onClose: () => void
}

export function WorkshopSelectionEditor({
  initialSelections,
  onUpdated,
  onClose,
}: WorkshopSelectionEditorProps) {
  const [workshops, setWorkshops] = useState<WorkshopApiItem[]>([])
  const [selected, setSelected] = useState<string[]>(initialSelections || [])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/workshops")
        const data = await res.json()
        if (data.success) {
          setWorkshops(data.data as WorkshopApiItem[])
        } else {
          setError(data.message || "Failed to load workshops")
        }
      } catch (e) {
        setError("Failed to load workshops")
      } finally {
        setIsLoading(false)
      }
    }
    fetchWorkshops()
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }

  const canSave = useMemo(() => !isSaving && !isLoading, [isSaving, isLoading])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError("")
      const res = await fetch("/api/user/workshops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopSelections: selected }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to update workshops")
      }
      onUpdated(selected)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update workshops")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Edit Workshop Selections</h3>
      </div>
      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {workshops.map((ws) => {
            const label = ws.label || ws.name || ws.id
            const disabled = !ws.canRegister && !selected.includes(ws.id)
            const seatInfo = ws.availableSeats
            const seatClass =
              seatInfo > 10
                ? "text-green-600"
                : seatInfo > 0
                ? "text-yellow-600"
                : "text-red-600"
            return (
              <div
                key={ws.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  disabled ? "opacity-60 bg-gray-50 dark:bg-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-900/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={ws.id}
                    checked={selected.includes(ws.id)}
                    onCheckedChange={() => toggle(ws.id)}
                    disabled={disabled || isSaving}
                  />
                  <div>
                    <label htmlFor={ws.id} className="text-sm font-medium">
                      {label}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {typeof ws.price === "number" || typeof ws.amount === "number"
                        ? `₹${(ws.price ?? ws.amount ?? 0).toLocaleString()}`
                        : null}
                      <span className={`ml-2 ${seatClass}`}>
                        • {seatInfo > 0 ? `${seatInfo} seats left` : "Fully Booked"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          {workshops.length === 0 && (
            <div className="text-sm text-gray-500">No workshops available.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="h-4 w-4" />
          Changes are allowed until payment is completed.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


