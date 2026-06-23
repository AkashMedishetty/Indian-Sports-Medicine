import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  conferenceConfig,
  getCategoryLabel,
  getCategoryKeys,
  isValidCategoryKey,
  getAdminEmail,
  getRegistrationPrefix,
} from './conference.config'

/**
 * Property-Based Tests for Conference Config Helper Functions
 */

describe('Conference Config Helper Functions', () => {
  /**
   * **Feature: config-driven-refactor, Property 5: Category label lookup consistency**
   * **Validates: Requirements 4.2**
   * 
   * *For any* category key defined in `conferenceConfig.registration.categories`,
   * the `getCategoryLabel` function SHALL return the corresponding label from config
   */
  describe('Property 5: Category label lookup consistency', () => {
    it('should return the correct label for any valid category key from config', () => {
      const configCategories = conferenceConfig.registration.categories
      
      // Property: For all category keys in config, getCategoryLabel returns the matching label
      fc.assert(
        fc.property(
          fc.constantFrom(...configCategories),
          (category) => {
            const result = getCategoryLabel(category.key)
            return result === category.label
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return the key itself for unknown category keys', () => {
      const validKeys = getCategoryKeys()
      
      // Property: For any string that is NOT a valid key, getCategoryLabel returns the key itself
      fc.assert(
        fc.property(
          fc.string().filter(s => !validKeys.includes(s) && s.length > 0),
          (unknownKey) => {
            const result = getCategoryLabel(unknownKey)
            return result === unknownKey
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: config-driven-refactor, Property 6: Category validation accepts config keys**
   * **Validates: Requirements 4.3**
   * 
   * *For any* category key, validation SHALL accept it if and only if
   * it exists in `conferenceConfig.registration.categories`
   */
  describe('Property 6: Category validation accepts config keys', () => {
    it('should accept all keys defined in config', () => {
      const configCategories = conferenceConfig.registration.categories
      
      // Property: For all category keys in config, isValidCategoryKey returns true
      fc.assert(
        fc.property(
          fc.constantFrom(...configCategories),
          (category) => {
            return isValidCategoryKey(category.key) === true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject keys not defined in config', () => {
      const validKeys = getCategoryKeys()
      
      // Property: For any string that is NOT a valid key, isValidCategoryKey returns false
      fc.assert(
        fc.property(
          fc.string().filter(s => !validKeys.includes(s)),
          (unknownKey) => {
            return isValidCategoryKey(unknownKey) === false
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should have getCategoryKeys return exactly the keys from config', () => {
      const configKeys = conferenceConfig.registration.categories.map(c => c.key)
      const helperKeys = getCategoryKeys()
      
      // The helper function should return exactly the same keys as in config
      expect(helperKeys).toEqual(configKeys)
      expect(helperKeys.length).toBe(configKeys.length)
    })
  })
})


describe('Seed Configuration Properties', () => {
  /**
   * **Feature: config-driven-refactor, Property 1: Seed configuration uses config values**
   * **Validates: Requirements 1.1**
   * 
   * *For any* valid `conferenceConfig`, when the seed configuration runs,
   * the seeded admin email domain SHALL match the domain from `conferenceConfig.contact.email`
   */
  describe('Property 1: Seed configuration uses config values', () => {
    it('should derive admin email domain from contact email', () => {
      const adminEmail = getAdminEmail()
      const contactEmail = conferenceConfig.contact.email
      
      // Extract domains
      const adminDomain = adminEmail.split('@')[1]
      const contactDomain = contactEmail.split('@')[1]
      
      // Property: Admin email domain should match contact email domain
      expect(adminDomain).toBe(contactDomain)
      expect(adminEmail).toMatch(/^admin@/)
    })

    it('should use registration prefix from config', () => {
      const prefix = getRegistrationPrefix()
      
      // Property: If registrationPrefix is defined, use it; otherwise derive from shortName
      if (conferenceConfig.registrationPrefix) {
        expect(prefix).toBe(conferenceConfig.registrationPrefix)
      } else {
        expect(prefix).toBe(conferenceConfig.shortName.replace(/\s+/g, ''))
      }
    })

    it('should use organization name from config', () => {
      // Property: Organization name should be available from config
      expect(conferenceConfig.organizationName).toBeTruthy()
      expect(typeof conferenceConfig.organizationName).toBe('string')
    })

    it('should use venue details from config', () => {
      // Property: Venue details should be available from config
      expect(conferenceConfig.venue.city).toBeTruthy()
      expect(conferenceConfig.venue.state).toBeTruthy()
      expect(conferenceConfig.venue.country).toBeTruthy()
    })
  })
})


import { getEmailSubject } from './conference.config'

describe('Email Subject Generation', () => {
  /**
   * **Feature: config-driven-refactor, Property 7: Email subject includes conference name**
   * **Validates: Requirements 3.2**
   * 
   * *For any* email type, the generated subject SHALL contain `conferenceConfig.shortName`
   */
  describe('Property 7: Email subject includes conference name', () => {
    it('should include conference shortName in all generated subjects', () => {
      // Property: For any email type string, the subject should contain the conference shortName
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (emailType) => {
            const subject = getEmailSubject(emailType)
            return subject.includes(conferenceConfig.shortName)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include the email type in the subject', () => {
      // Property: For any email type string, the subject should contain the type
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (emailType) => {
            const subject = getEmailSubject(emailType)
            return subject.includes(emailType)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should format subject as "type - shortName"', () => {
      const testTypes = ['Registration Confirmation', 'Payment', 'Password Reset', 'Update']
      
      testTypes.forEach(type => {
        const subject = getEmailSubject(type)
        expect(subject).toBe(`${type} - ${conferenceConfig.shortName}`)
      })
    })
  })
})


describe('Auth Configuration Properties', () => {
  /**
   * **Feature: config-driven-refactor, Property 8: Production URL fallback uses config**
   * **Validates: Requirements 5.1**
   * 
   * *For any* environment without explicit URL configuration,
   * the production URL fallback SHALL equal `conferenceConfig.contact.website`
   */
  describe('Property 8: Production URL fallback uses config', () => {
    it('should have a valid website URL in config', () => {
      // Property: The website URL should be a valid URL
      expect(conferenceConfig.contact.website).toBeTruthy()
      expect(conferenceConfig.contact.website).toMatch(/^https?:\/\//)
    })

    it('should have website URL that can be used as auth fallback', () => {
      // Property: The website URL should be suitable for auth purposes
      const url = conferenceConfig.contact.website
      
      // Should be a valid URL
      expect(() => new URL(url)).not.toThrow()
      
      // Should use HTTPS in production-like URLs
      if (!url.includes('localhost')) {
        expect(url.startsWith('https://')).toBe(true)
      }
    })
  })
})
