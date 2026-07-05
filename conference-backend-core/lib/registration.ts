export type RegistrationTier = "Early Bird" | "Regular" | "Spot Registration"

export interface RegistrationWindows {
	earlyBirdEnd: Date
	regularStart: Date
	regularEnd: Date
	spotStart: Date
}

// TASMC 2026 registration windows
export const registrationWindows: RegistrationWindows = {
	earlyBirdEnd: new Date("2026-07-31T23:59:59"),
	regularStart: new Date("2026-08-01T00:00:00"),
	regularEnd: new Date("2026-09-04T23:59:59"),
	spotStart: new Date("2026-09-05T00:00:00"),
}

export function getCurrentTier(date: Date = new Date()): RegistrationTier {
	// Use IST (UTC+5:30) for tier determination
	const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
	const todayIST = istDate.toISOString().split('T')[0]
	const earlyEnd = registrationWindows.earlyBirdEnd.toISOString().split('T')[0]
	const regularEnd = registrationWindows.regularEnd.toISOString().split('T')[0]
	if (todayIST <= earlyEnd) return "Early Bird"
	if (todayIST <= regularEnd) return "Regular"
	return "Spot Registration"
}

export function getTierByDate(date: Date): RegistrationTier {
	return getCurrentTier(date)
}

export const registrationLabels = {
	earlyBird: "Early Bird upto 31/07/2026",
	regular: "Regular 01/08/2026–04/09/2026",
	spot: "Spot at the Conference",
}

export function getTierSummary(now: Date = new Date()): string {
	return `${registrationLabels.earlyBird} · ${registrationLabels.regular} · ${registrationLabels.spot}`
}

// Pricing per tier - fallback values (primary source is database)
export type RegistrationCategory = "issh-member" | "non-issh-member" | "postgraduate"

export interface TierPricing {
	[category: string]: { amount: number; currency: "INR"; label?: string }
}

// TASMC tariff (₹). Member = TASM member (consultant/practitioner rate),
// Non-Member = consultant/practitioner, Postgraduate = resident/student.
// faculty/physiotherapist/international are provisional — confirm with client.
const PRICING_BY_TIER: Record<RegistrationTier, TierPricing> = {
	"Early Bird": {
		"iasm-member":     { amount: 3500, currency: "INR", label: "TASM Member" },
		"non-member":      { amount: 4000, currency: "INR", label: "Non-Member" },
		"postgraduate":    { amount: 3000, currency: "INR", label: "Postgraduate / Student" },
		"faculty":         { amount: 3500, currency: "INR", label: "Faculty" },
		"physiotherapist": { amount: 4000, currency: "INR", label: "Physiotherapist / Allied Health" },
		"international":   { amount: 4000, currency: "INR", label: "International Delegate" },
	},
	"Regular": {
		"iasm-member":     { amount: 4000, currency: "INR", label: "TASM Member" },
		"non-member":      { amount: 4500, currency: "INR", label: "Non-Member" },
		"postgraduate":    { amount: 3500, currency: "INR", label: "Postgraduate / Student" },
		"faculty":         { amount: 4000, currency: "INR", label: "Faculty" },
		"physiotherapist": { amount: 4500, currency: "INR", label: "Physiotherapist / Allied Health" },
		"international":   { amount: 4500, currency: "INR", label: "International Delegate" },
	},
	"Spot Registration": {
		"iasm-member":     { amount: 5000, currency: "INR", label: "TASM Member" },
		"non-member":      { amount: 5000, currency: "INR", label: "Non-Member" },
		"postgraduate":    { amount: 4000, currency: "INR", label: "Postgraduate / Student" },
		"faculty":         { amount: 5000, currency: "INR", label: "Faculty" },
		"physiotherapist": { amount: 5000, currency: "INR", label: "Physiotherapist / Allied Health" },
		"international":   { amount: 5000, currency: "INR", label: "International Delegate" },
	},
}

export function getTierPricing(tier: RegistrationTier = getCurrentTier()): TierPricing {
	return PRICING_BY_TIER[tier]
}
