import ExcelJS from 'exceljs'
import connectDB from '@/lib/mongodb'
import User from '@/conference-backend-core/lib/models/User'
import Abstract from '@/conference-backend-core/lib/models/Abstract'
import CertificateCollection from '@/conference-backend-core/lib/models/CertificateCollection'
import {
  ELIGIBLE_ABSTRACT_STATUSES,
  NON_DELEGATE_ROLES,
  PAID_STATUSES,
  displayName,
} from './service'
import { CERT_LABEL, CERT_TYPES, type CertType } from './types'

/**
 * Certificate distribution workbook.
 *
 * Sheets: Summary, Collected, then one Pending sheet per type. Pending is the
 * point of the export — "who has NOT collected yet" is what the desk chases at
 * the end of the day, and it cannot be derived from the collected list alone.
 *
 * Timestamps are rendered in IST, since every reader of this file is on site.
 */

const IST = 'Asia/Kolkata'
const istString = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-IN', { timeZone: IST, hour12: true }) : ''

function header(sheet: ExcelJS.Worksheet, columns: Array<{ header: string; key: string; width: number }>) {
  sheet.columns = columns
  const row = sheet.getRow(1)
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D528C' } }
  row.alignment = { vertical: 'middle' }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
}

export async function buildCertificateWorkbook(): Promise<ExcelJS.Buffer> {
  await connectDB()

  const [records, delegates, abstracts] = (await Promise.all([
    CertificateCollection.find({}).sort({ collectedAt: -1 }).lean(),
    User.find({
      'registration.status': { $in: PAID_STATUSES },
      role: { $nin: NON_DELEGATE_ROLES },
      'registration.registrationId': { $exists: true, $ne: '' },
    })
      .select('email profile registration.registrationId registration.status')
      .lean(),
    Abstract.find({ track: { $in: ['poster', 'paper'] }, status: { $in: ELIGIBLE_ABSTRACT_STATUSES } })
      .select('abstractId title track status userId')
      .lean(),
  ])) as [any[], any[], any[]]

  const active = records.filter((r) => r.active !== false)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'IASMCON 2026'
  wb.created = new Date()

  /* ------------------------------------------------------------ Summary */
  const summary = wb.addWorksheet('Summary')
  header(summary, [
    { header: 'Certificate', key: 'type', width: 26 },
    { header: 'Eligible', key: 'eligible', width: 12 },
    { header: 'Collected', key: 'collected', width: 12 },
    { header: 'Pending', key: 'pending', width: 12 },
    { header: 'Overrides', key: 'overrides', width: 12 },
    { header: 'Undone', key: 'undone', width: 12 },
  ])

  const delegateById = new Map(delegates.map((u) => [String(u._id), u]))
  const eligibleCount: Record<CertType, number> = {
    participation: delegates.length,
    poster: abstracts.filter((a) => a.track === 'poster').length,
    paper: abstracts.filter((a) => a.track === 'paper').length,
  }

  for (const type of CERT_TYPES) {
    const mine = active.filter((r) => r.type === type)
    summary.addRow({
      type: CERT_LABEL[type],
      eligible: eligibleCount[type],
      collected: mine.length,
      pending: Math.max(0, eligibleCount[type] - mine.length),
      overrides: mine.filter((r) => r.override).length,
      undone: records.filter((r) => r.type === type && r.active === false).length,
    })
  }
  summary.addRow({})
  summary.addRow({ type: `Generated ${istString(new Date())} IST` })

  /* ---------------------------------------------------------- Collected */
  const collected = wb.addWorksheet('Collected')
  header(collected, [
    { header: 'Certificate', key: 'type', width: 22 },
    { header: 'Reg ID', key: 'registrationId', width: 14 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Institution', key: 'institution', width: 28 },
    { header: 'Abstract ID', key: 'abstractId', width: 20 },
    { header: 'Abstract title', key: 'abstractTitle', width: 46 },
    { header: 'Collected at (IST)', key: 'collectedAt', width: 22 },
    { header: 'Desk', key: 'deskName', width: 18 },
    { header: 'Override', key: 'override', width: 10 },
    { header: 'Override reason', key: 'overrideReason', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Undone at (IST)', key: 'undoneAt', width: 22 },
  ])
  for (const r of records) {
    collected.addRow({
      type: CERT_LABEL[r.type as CertType] ?? r.type,
      registrationId: r.registrationId,
      name: r.name,
      email: r.email,
      institution: r.institution,
      abstractId: r.abstractId,
      abstractTitle: r.abstractTitle,
      collectedAt: istString(r.collectedAt),
      deskName: r.deskName,
      override: r.override ? 'YES' : '',
      overrideReason: r.overrideReason,
      status: r.active === false ? 'UNDONE' : 'collected',
      undoneAt: istString(r.undoneAt),
    })
  }

  /* ------------------------------------------------------------ Pending */
  const collectedUsers = new Set(active.filter((r) => r.type === 'participation').map((r) => String(r.userId)))
  const pendingP = wb.addWorksheet('Pending participation')
  header(pendingP, [
    { header: 'Reg ID', key: 'registrationId', width: 14 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Institution', key: 'institution', width: 28 },
  ])
  for (const u of delegates) {
    if (collectedUsers.has(String(u._id))) continue
    pendingP.addRow({
      registrationId: u.registration?.registrationId ?? '',
      name: displayName(u.profile, u.email ?? ''),
      email: u.email ?? '',
      institution: u.profile?.institution ?? '',
    })
  }

  for (const track of ['poster', 'paper'] as const) {
    const done = new Set(active.filter((r) => r.type === track).map((r) => r.abstractId))
    const sheet = wb.addWorksheet(`Pending ${track}`)
    header(sheet, [
      { header: 'Abstract ID', key: 'abstractId', width: 20 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Reg ID', key: 'registrationId', width: 14 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Abstract status', key: 'status', width: 18 },
      { header: 'Note', key: 'note', width: 34 },
    ])
    for (const a of abstracts.filter((x) => x.track === track)) {
      const id = String(a.abstractId || a._id)
      if (done.has(id)) continue
      const u = delegateById.get(String(a.userId))
      sheet.addRow({
        abstractId: id,
        title: a.title ?? '',
        registrationId: u?.registration?.registrationId ?? '',
        name: u ? displayName(u.profile, u.email ?? '') : '',
        email: u?.email ?? '',
        status: a.status ?? '',
        // Flagged rather than hidden: these presenters are on no counter list.
        note: u ? '' : 'Owner not a paid delegate — not on any counter list',
      })
    }
  }

  return wb.xlsx.writeBuffer()
}
