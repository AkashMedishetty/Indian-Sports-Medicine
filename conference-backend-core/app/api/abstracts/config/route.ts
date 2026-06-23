import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import AbstractsConfig from '@/conference-backend-core/lib/models/AbstractsConfig'
import { defaultAbstractsSettings } from '@/lib/config/abstracts'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

const CONFIG_TYPE = 'abstracts'
const CONFIG_KEY = 'settings'

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const config = await Configuration.findOne({ type: CONFIG_TYPE, key: CONFIG_KEY })
    
    // Also fetch the new AbstractsConfig for guidelines, templates, and submission window
    const abstractsConfig = await AbstractsConfig.findOne({})
    
    // Check if abstract submission feature is enabled in admin panel
    const featureConfig = await Configuration.findOne({ type: 'features', key: 'abstractSubmission' })
    const isFeatureEnabled = featureConfig?.value ?? conferenceConfig.features.abstractSubmission
    
    // Return config or defaults
    const settings = config?.value || defaultAbstractsSettings
    
    // Merge submissionWindow from both sources:
    // The inline AbstractsSettingsManager saves submissionWindow to the Configuration collection
    // but it may also be stored directly on the AbstractsConfig document.
    // Check both: prefer Configuration collection, but also check AbstractsConfig fields.
    const submissionWindowEnabled = settings.submissionWindow?.enabled || abstractsConfig?.submissionWindow?.enabled || false
    const submissionStart = settings.submissionWindow?.start || abstractsConfig?.submissionOpenDate
    const submissionEnd = settings.submissionWindow?.end || abstractsConfig?.submissionCloseDate
    
    // Override: extend abstract submission deadline to April 7, 2026 at midnight IST
    // IST is UTC+5:30, so midnight IST = 18:30 UTC previous day
    const ABSTRACT_DEADLINE_OVERRIDE = '2026-04-07T18:29:59Z'
    
    // Also check enableAbstractsWithoutRegistration from both sources
    const enableAbstractsWithoutRegistration = settings.enableAbstractsWithoutRegistration || abstractsConfig?.enableAbstractsWithoutRegistration || false
    
    // Check if submissions are open based on dates
    const now = new Date()
    let isOpen = false
    let daysRemaining = 0
    
    if (submissionWindowEnabled && submissionStart && submissionEnd) {
      const startDate = new Date(submissionStart)
      const endDate = new Date(ABSTRACT_DEADLINE_OVERRIDE)
      isOpen = now <= endDate && now >= startDate
      daysRemaining = isOpen ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    } else if (submissionWindowEnabled) {
      // If enabled but no dates set, treat as open
      isOpen = true
    }
    
    // Check final submission window
    let isFinalSubmissionOpen = false
    if (abstractsConfig?.finalSubmissionOpenDate && abstractsConfig?.finalSubmissionCloseDate) {
      const finalStart = new Date(abstractsConfig.finalSubmissionOpenDate)
      const finalEnd = new Date(abstractsConfig.finalSubmissionCloseDate)
      isFinalSubmissionOpen = now >= finalStart && now <= finalEnd
    }
    
    const effectiveEnd = ABSTRACT_DEADLINE_OVERRIDE
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...settings,
        // Override submissionWindow with merged data
        submissionWindow: {
          ...settings.submissionWindow,
          enabled: submissionWindowEnabled,
          start: submissionStart || settings.submissionWindow?.start,
          end: effectiveEnd,
        },
        enableAbstractsWithoutRegistration,
        featureEnabled: isFeatureEnabled,
        isCurrentlyOpen: isOpen && isFeatureEnabled,
        daysRemaining,
        // Add guidelines and templates from AbstractsConfig
        guidelines: abstractsConfig?.guidelines || settings.guidelines || null,
        fileRequirements: abstractsConfig?.fileRequirements || null,
        isFinalSubmissionOpen,
        finalSubmissionDeadline: abstractsConfig?.finalSubmissionCloseDate || null
      }
    })
  } catch (error) {
    console.error('Abstracts config fetch error:', error)
    // Return defaults on error
    return NextResponse.json({ success: true, data: { ...defaultAbstractsSettings, featureEnabled: true } })
  }
}


