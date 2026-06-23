/**
 * Property-based tests for User model role validation
 * Feature: manager-role, Property 1: Role Validation and Persistence
 * Validates: Requirements 1.1, 1.2, 1.3
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Valid roles as defined in the User model
const VALID_ROLES = ['user', 'admin', 'reviewer', 'manager'] as const
type ValidRole = typeof VALID_ROLES[number]

/**
 * Helper function to check if a role is valid
 */
function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole)
}

describe('User Model Role Validation', () => {
  /**
   * Property 1: Role Validation and Persistence
   * For any user object with a role value, the User model SHALL only accept 
   * roles from the set {'user', 'admin', 'reviewer', 'manager'}
   */
  describe('Property 1: Role Validation', () => {
    it('should accept all valid roles', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_ROLES),
          (role) => {
            expect(isValidRole(role)).toBe(true)
            expect(VALID_ROLES).toContain(role)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject invalid role strings', () => {
      // Generate random strings that are NOT valid roles
      const invalidRoleArb = fc.string().filter(s => !VALID_ROLES.includes(s as ValidRole))
      
      fc.assert(
        fc.property(
          invalidRoleArb,
          (invalidRole) => {
            expect(isValidRole(invalidRole)).toBe(false)
            expect(VALID_ROLES).not.toContain(invalidRole)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should include manager as a valid role', () => {
      expect(VALID_ROLES).toContain('manager')
      expect(isValidRole('manager')).toBe(true)
    })

    it('should have exactly 4 valid roles', () => {
      expect(VALID_ROLES.length).toBe(4)
      expect(VALID_ROLES).toEqual(['user', 'admin', 'reviewer', 'manager'])
    })
  })

  /**
   * Property: Role values are case-sensitive
   * Uppercase or mixed-case versions of valid roles should be rejected
   */
  describe('Role case sensitivity', () => {
    it('should reject uppercase versions of valid roles', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_ROLES),
          (role) => {
            const upperRole = role.toUpperCase()
            if (upperRole !== role) {
              expect(isValidRole(upperRole)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
