import Configuration from '@/lib/models/Configuration'
import Abstract from '@/lib/models/Abstract'
import mongoose from 'mongoose'

type AssignmentRule = {
  track: string
  category?: string
  subcategory?: string
  reviewerIds: string[]
  reviewersPerAbstract: number
}

export async function loadReviewerAssignments(): Promise<AssignmentRule[]> {
  const cfg = await Configuration.findOne({ type: 'abstracts', key: 'reviewer_assignments' })
  const value = (cfg?.value || []) as AssignmentRule[]
  return Array.isArray(value) ? value : []
}

export function findRuleFor(track: string, category?: string, subcategory?: string, rules: AssignmentRule[] = []): AssignmentRule | null {
  // Try most specific to least specific
  const byAll = rules.find(r => r.track === track && r.category === category && r.subcategory === subcategory)
  if (byAll) return byAll
  const byTrackCategory = rules.find(r => r.track === track && r.category === category && !r.subcategory)
  if (byTrackCategory) return byTrackCategory
  const byTrackOnly = rules.find(r => r.track === track && !r.category && !r.subcategory)
  if (byTrackOnly) return byTrackOnly
  return null
}

export async function chooseReviewersLoadBased(rule: AssignmentRule | null, defaultCount = 2): Promise<string[]> {
  if (!rule || !rule.reviewerIds || rule.reviewerIds.length === 0) return []
  const n = Math.max(1, rule.reviewersPerAbstract || defaultCount)
  // Count current assignments per reviewer
  const counts = await Abstract.aggregate([
    { $match: { assignedReviewerIds: { $in: rule.reviewerIds.map(id => new (mongoose as any).Types.ObjectId(id)) }, status: { $in: ['submitted', 'under-review'] } } },
    { $unwind: '$assignedReviewerIds' },
    { $match: { assignedReviewerIds: { $in: rule.reviewerIds.map(id => new (mongoose as any).Types.ObjectId(id)) } } },
    { $group: { _id: '$assignedReviewerIds', total: { $sum: 1 } } }
  ])
  const idToCount = new Map<string, number>()
  for (const id of rule.reviewerIds) idToCount.set(id, 0)
  counts.forEach((c: any) => idToCount.set(String(c._id), c.total))
  const sorted = [...rule.reviewerIds].sort((a, b) => (idToCount.get(a)! - idToCount.get(b)!))
  return sorted.slice(0, Math.min(n, sorted.length))
}

export function chooseReviewersRoundRobin(rule: AssignmentRule | null, cursor: number, defaultCount = 2): { ids: string[]; nextCursor: number } {
  if (!rule || !rule.reviewerIds || rule.reviewerIds.length === 0) return { ids: [], nextCursor: cursor }
  const n = Math.max(1, rule.reviewersPerAbstract || defaultCount)
  const list = rule.reviewerIds
  const ids: string[] = []
  for (let i = 0; i < Math.min(n, list.length); i++) {
    ids.push(list[(cursor + i) % list.length])
  }
  const nextCursor = (cursor + n) % list.length
  return { ids, nextCursor }
}


