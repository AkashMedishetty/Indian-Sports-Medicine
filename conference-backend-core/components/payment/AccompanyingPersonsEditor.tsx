"use client"

import { useState } from "react"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Separator } from "@/conference-backend-core/components/ui/separator"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Plus, Trash2, Save, Loader2 } from "lucide-react"

interface Person {
  name: string
  age: number
  relationship: string
}

interface AccompanyingPersonsEditorProps {
  initialPersons: Person[]
  onUpdated: (persons: Person[]) => void
  onClose: () => void
}

export function AccompanyingPersonsEditor({
  initialPersons,
  onUpdated,
  onClose,
}: AccompanyingPersonsEditorProps) {
  const [persons, setPersons] = useState<Person[]>(initialPersons || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const addPerson = () => {
    setPersons((prev) => [...prev, { name: "", age: 0, relationship: "" }])
  }

  const removePerson = (index: number) => {
    setPersons((prev) => prev.filter((_, i) => i !== index))
  }

  const updateField = (index: number, field: keyof Person, value: string) => {
    setPersons((prev) => {
      const copy = [...prev]
      if (field === "age") {
        const num = Number(value)
        copy[index].age = isNaN(num) ? 0 : num
      } else {
        ;(copy[index] as any)[field] = value
      }
      return copy
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError("")
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration: { accompanyingPersons: persons } }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || "Failed to update accompanying persons")
      }
      onUpdated(persons)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update accompanying persons")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Edit Accompanying Persons</h3>
      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {persons.map((p, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5">
              <Label htmlFor={`name-${idx}`}>Name</Label>
              <Input
                id={`name-${idx}`}
                value={p.name}
                onChange={(e) => updateField(idx, "name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor={`age-${idx}`}>Age</Label>
              <Input
                id={`age-${idx}`}
                type="number"
                min={0}
                value={p.age}
                onChange={(e) => updateField(idx, "age", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="col-span-4">
              <Label htmlFor={`rel-${idx}`}>Relationship</Label>
              <Input
                id={`rel-${idx}`}
                value={p.relationship}
                onChange={(e) => updateField(idx, "relationship", e.target.value)}
                placeholder="Spouse / Colleague"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePerson(idx)}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {persons.length === 0 && (
          <div className="text-sm text-gray-500">No accompanying persons added.</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addPerson}>
          <Plus className="h-4 w-4 mr-2" /> Add Person
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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


