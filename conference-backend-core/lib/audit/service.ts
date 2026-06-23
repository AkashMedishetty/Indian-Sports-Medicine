/**
 * Audit Logging Service
 * Provides append-only audit trail for all system actions
 */

import AuditLog, { 
  AuditAction, 
  ResourceType, 
  IAuditLog 
} from '../models/AuditLog'
import { Types } from 'mongoose'

export interface LogActionOptions {
  // Actor info
  actor: {
    userId: string | Types.ObjectId
    email: string
    role: string
    name?: string
  }
  
  // Action details
  action: AuditAction
  resourceType: ResourceType
  resourceId: string
  resourceName?: string
  
  // Changes (for updates)
  changes?: {
    before: Record<string, any>
    after: Record<string, any>
    fields?: string[]
  }
  
  // Request metadata
  metadata: {
    ip: string
    userAgent: string
    sessionId?: string
    requestId?: string
  }
  
  // Additional context
  description?: string
  tags?: string[]
}

export interface AuditLogResult {
  success: boolean
  auditId?: string
  error?: string
}

/**
 * Log an action to the audit trail (append-only)
 */
export async function logAction(options: LogActionOptions): Promise<AuditLogResult> {
  const {
    actor,
    action,
    resourceType,
    resourceId,
    resourceName,
    changes,
    metadata,
    description,
    tags
  } = options

  try {
    // Calculate changed fields if not provided
    let changedFields = changes?.fields
    if (changes && !changedFields) {
      changedFields = Object.keys(changes.after).filter(
        key => JSON.stringify(changes.before[key]) !== JSON.stringify(changes.after[key])
      )
    }

    const auditLog = await AuditLog.create({
      timestamp: new Date(),
      actor: {
        userId: new Types.ObjectId(actor.userId.toString()),
        email: actor.email,
        role: actor.role,
        name: actor.name
      },
      action,
      resourceType,
      resourceId,
      resourceName,
      changes: changes ? {
        before: changes.before,
        after: changes.after,
        fields: changedFields
      } : undefined,
      metadata: {
        ip: metadata.ip || 'unknown',
        userAgent: metadata.userAgent || '',
        sessionId: metadata.sessionId,
        requestId: metadata.requestId
      },
      description,
      tags
    })

    return {
      success: true,
      auditId: auditLog.auditId
    }
  } catch (error) {
    console.error('Failed to log audit action:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getAuditLogsForResource(
  resourceType: ResourceType,
  resourceId: string,
  options?: {
    limit?: number
    skip?: number
  }
): Promise<{ logs: IAuditLog[], total: number }> {
  const query = { resourceType, resourceId }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    AuditLog.countDocuments(query)
  ])

  return { logs, total }
}

/**
 * Get audit logs for a specific actor (user)
 */
export async function getAuditLogsForActor(
  actorUserId: string,
  options?: {
    limit?: number
    skip?: number
    action?: AuditAction
    resourceType?: ResourceType
  }
): Promise<{ logs: IAuditLog[], total: number }> {
  const query: any = { 'actor.userId': new Types.ObjectId(actorUserId) }
  
  if (options?.action) query.action = options.action
  if (options?.resourceType) query.resourceType = options.resourceType

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    AuditLog.countDocuments(query)
  ])

  return { logs, total }
}


/**
 * Get all audit logs with filtering
 */
export async function getAuditLogs(options?: {
  limit?: number
  skip?: number
  action?: AuditAction
  resourceType?: ResourceType
  actorRole?: string
  startDate?: Date
  endDate?: Date
  search?: string
}): Promise<{ logs: IAuditLog[], total: number }> {
  const query: any = {}
  
  if (options?.action) query.action = options.action
  if (options?.resourceType) query.resourceType = options.resourceType
  if (options?.actorRole) query['actor.role'] = options.actorRole
  
  if (options?.startDate || options?.endDate) {
    query.timestamp = {}
    if (options?.startDate) query.timestamp.$gte = options.startDate
    if (options?.endDate) query.timestamp.$lte = options.endDate
  }
  
  if (options?.search) {
    // Escape special regex characters to prevent invalid regex patterns
    const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { 'actor.email': { $regex: escapedSearch, $options: 'i' } },
      { resourceId: { $regex: escapedSearch, $options: 'i' } },
      { resourceName: { $regex: escapedSearch, $options: 'i' } },
      { description: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    AuditLog.countDocuments(query)
  ])

  return { logs, total }
}

/**
 * Get recent activity for a user (their actions + actions on their resources)
 */
export async function getUserActivity(
  userId: string,
  options?: {
    limit?: number
    skip?: number
  }
): Promise<{ logs: IAuditLog[], total: number }> {
  const userObjectId = new Types.ObjectId(userId)
  
  const query = {
    $or: [
      { 'actor.userId': userObjectId },
      { resourceType: 'user', resourceId: userId }
    ]
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    AuditLog.countDocuments(query)
  ])

  return { logs, total }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(options?: {
  startDate?: Date
  endDate?: Date
}): Promise<{
  total: number
  byAction: Record<string, number>
  byResourceType: Record<string, number>
  byActorRole: Record<string, number>
}> {
  const matchStage: any = {}
  
  if (options?.startDate || options?.endDate) {
    matchStage.timestamp = {}
    if (options?.startDate) matchStage.timestamp.$gte = options.startDate
    if (options?.endDate) matchStage.timestamp.$lte = options.endDate
  }

  const [actionStats, resourceStats, roleStats, totalCount] = await Promise.all([
    AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]),
    AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } }
    ]),
    AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$actor.role', count: { $sum: 1 } } }
    ]),
    AuditLog.countDocuments(matchStage)
  ])

  const stats = {
    total: totalCount,
    byAction: {} as Record<string, number>,
    byResourceType: {} as Record<string, number>,
    byActorRole: {} as Record<string, number>
  }

  actionStats.forEach((a: any) => { stats.byAction[a._id] = a.count })
  resourceStats.forEach((r: any) => { stats.byResourceType[r._id] = r.count })
  roleStats.forEach((r: any) => { stats.byActorRole[r._id] = r.count })

  return stats
}

// Convenience functions for common audit actions

/**
 * Log user creation
 */
export async function logUserCreated(
  actor: LogActionOptions['actor'],
  userId: string,
  userEmail: string,
  metadata: LogActionOptions['metadata']
): Promise<AuditLogResult> {
  return logAction({
    actor,
    action: 'user.created',
    resourceType: 'user',
    resourceId: userId,
    resourceName: userEmail,
    metadata,
    description: `User ${userEmail} was created`
  })
}

/**
 * Log user login
 */
export async function logUserLogin(
  userId: string,
  email: string,
  role: string,
  metadata: LogActionOptions['metadata']
): Promise<AuditLogResult> {
  return logAction({
    actor: { userId, email, role },
    action: 'user.login',
    resourceType: 'user',
    resourceId: userId,
    resourceName: email,
    metadata,
    description: `User ${email} logged in`
  })
}

/**
 * Log payment action
 */
export async function logPaymentAction(
  actor: LogActionOptions['actor'],
  action: 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.verified' | 'payment.refunded',
  paymentId: string,
  registrationId: string,
  metadata: LogActionOptions['metadata'],
  details?: Record<string, any>
): Promise<AuditLogResult> {
  return logAction({
    actor,
    action,
    resourceType: 'payment',
    resourceId: paymentId,
    resourceName: registrationId,
    metadata,
    description: `Payment ${action.split('.')[1]} for registration ${registrationId}`,
    changes: details ? { before: {}, after: details } : undefined
  })
}

/**
 * Log registration action
 */
export async function logRegistrationAction(
  actor: LogActionOptions['actor'],
  action: 'registration.created' | 'registration.updated' | 'registration.cancelled' | 'registration.confirmed',
  registrationId: string,
  metadata: LogActionOptions['metadata'],
  changes?: LogActionOptions['changes']
): Promise<AuditLogResult> {
  return logAction({
    actor,
    action,
    resourceType: 'registration',
    resourceId: registrationId,
    metadata,
    changes,
    description: `Registration ${registrationId} was ${action.split('.')[1]}`
  })
}

/**
 * Log abstract action
 */
export async function logAbstractAction(
  actor: LogActionOptions['actor'],
  action: 'abstract.submitted' | 'abstract.updated' | 'abstract.deleted' | 'abstract.assigned' | 'abstract.reviewed' | 'abstract.decision',
  abstractId: string,
  abstractTitle: string,
  metadata: LogActionOptions['metadata'],
  changes?: LogActionOptions['changes']
): Promise<AuditLogResult> {
  return logAction({
    actor,
    action,
    resourceType: 'abstract',
    resourceId: abstractId,
    resourceName: abstractTitle,
    metadata,
    changes,
    description: `Abstract "${abstractTitle}" was ${action.split('.')[1]}`
  })
}

/**
 * Log sponsor action
 */
export async function logSponsorAction(
  actor: LogActionOptions['actor'],
  action: 'sponsor.created' | 'sponsor.updated' | 'sponsor.deactivated' | 'sponsor.allocation_changed' | 'sponsor.password_reset' | 'sponsor.delegate_registered' | 'sponsor.delegate_claimed' | 'sponsor.bulk_upload',
  sponsorId: string,
  sponsorName: string,
  metadata: LogActionOptions['metadata'],
  changes?: LogActionOptions['changes']
): Promise<AuditLogResult> {
  return logAction({
    actor,
    action,
    resourceType: 'sponsor',
    resourceId: sponsorId,
    resourceName: sponsorName,
    metadata,
    changes,
    description: `Sponsor ${sponsorName}: ${action.split('.')[1].replace('_', ' ')}`
  })
}

/**
 * Log admin config change
 */
export async function logConfigChange(
  actor: LogActionOptions['actor'],
  configKey: string,
  metadata: LogActionOptions['metadata'],
  changes: LogActionOptions['changes']
): Promise<AuditLogResult> {
  return logAction({
    actor,
    action: 'admin.config_changed',
    resourceType: 'config',
    resourceId: configKey,
    metadata,
    changes,
    description: `Configuration "${configKey}" was changed`
  })
}

export default {
  logAction,
  getAuditLogsForResource,
  getAuditLogsForActor,
  getAuditLogs,
  getUserActivity,
  getAuditStats,
  logUserCreated,
  logUserLogin,
  logPaymentAction,
  logRegistrationAction,
  logAbstractAction,
  logSponsorAction,
  logConfigChange
}
