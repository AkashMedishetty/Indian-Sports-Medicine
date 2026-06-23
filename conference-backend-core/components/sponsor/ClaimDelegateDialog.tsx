"use client"

import { useState } from 'react'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Input } from '@/conference-backend-core/components/ui/input'
import { Label } from '@/conference-backend-core/components/ui/label'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/conference-backend-core/components/ui/dialog'
import { Alert, AlertDescription } from '@/conference-backend-core/components/ui/alert'
import { toast } from 'sonner'
import { Search, UserCheck, Loader2, CheckCircle, XCircle, AlertCircle, Mail, User, Building } from 'lucide-react'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

interface ClaimableUser {
  _id: string
  email: string
  name: string
  firstName: string
  lastName: string
  phone: string
  institution: string
  registrationId: string
  registrationType: string
}

interface SearchResult {
  found: boolean
  claimable?: boolean
  alreadySponsored?: boolean
  sponsoredByOther?: boolean
  alreadyConfirmed?: boolean
  user?: ClaimableUser
  message: string
}

export function ClaimDelegateDialog({ onClaimed }: { onClaimed?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)

  const handleSearch = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setSearching(true)
    setSearchResult(null)

    try {
      const res = await fetch(`/api/sponsor/delegates/search?email=${encodeURIComponent(email)}`)
      const data = await res.json()

      if (data.success) {
        setSearchResult(data)
      } else {
        toast.error(data.message || 'Search failed')
      }
    } catch (error) {
      toast.error('Failed to search')
    } finally {
      setSearching(false)
    }
  }

  const handleClaim = async () => {
    if (!searchResult?.user) return

    setClaiming(true)
    try {
      // Use the existing delegate registration endpoint which handles claiming
      const res = await fetch('/api/sponsor/delegates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: searchResult.user.email,
          firstName: searchResult.user.firstName,
          lastName: searchResult.user.lastName,
          phone: searchResult.user.phone || '0000000000',
          institution: searchResult.user.institution || 'N/A',
          address: 'N/A',
          city: 'N/A',
          state: 'N/A',
          pincode: '000000'
        })
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Successfully claimed ${searchResult.user.name}!`)
        setIsOpen(false)
        setEmail('')
        setSearchResult(null)
        onClaimed?.()
      } else {
        toast.error(data.message || 'Failed to claim delegate')
      }
    } catch (error) {
      toast.error('Failed to claim delegate')
    } finally {
      setClaiming(false)
    }
  }

  const resetDialog = () => {
    setEmail('')
    setSearchResult(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetDialog() }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserCheck className="h-4 w-4" />
          Claim Existing Registration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" style={{ color: conferenceConfig.theme.primary }} />
            Claim Existing Registration
          </DialogTitle>
          <DialogDescription>
            Search for delegates who have already registered but haven't paid yet. 
            You can claim them under your sponsorship.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label>Delegate Email Address</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="delegate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResult && (
            <div className="space-y-3">
              {/* Not Found */}
              {!searchResult.found && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No registration found with this email. You can register them as a new delegate instead.
                  </AlertDescription>
                </Alert>
              )}

              {/* Found but not claimable */}
              {searchResult.found && !searchResult.claimable && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{searchResult.message}</AlertDescription>
                </Alert>
              )}

              {/* Claimable User */}
              {searchResult.found && searchResult.claimable && searchResult.user && (
                <div className="space-y-3">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Found a claimable registration! This delegate has registered but hasn't paid yet.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium">{searchResult.user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {searchResult.user.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Registration ID:</span>
                        <div className="font-mono">{searchResult.user.registrationId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div>
                          <Badge variant="outline">{searchResult.user.registrationType}</Badge>
                        </div>
                      </div>
                      {searchResult.user.institution && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Institution:</span>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {searchResult.user.institution}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleClaim} 
                    disabled={claiming}
                    className="w-full text-white"
                    style={{ backgroundColor: conferenceConfig.theme.primary }}
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Claim This Delegate
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              <strong>What is claiming?</strong><br />
              When someone registers for the conference but hasn't paid yet, you can "claim" them 
              under your sponsorship. Their registration will be confirmed immediately and they'll 
              receive a confirmation email.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
