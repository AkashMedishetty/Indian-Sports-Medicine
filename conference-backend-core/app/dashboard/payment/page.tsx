import { Metadata } from "next"
import { Suspense } from "react"
import { ProtectedRoute } from "@/conference-backend-core/components/auth/ProtectedRoute"
import { DashboardPaymentForm } from "@/conference-backend-core/components/payment/DashboardPaymentForm"
import { WorkshopPayment } from "@/conference-backend-core/components/payment/WorkshopPayment"
import { MainLayout } from "@/conference-backend-core/components/layout/MainLayout"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: `Payment | ${conferenceConfig.shortName}`,
  description: `Complete your ${conferenceConfig.shortName} conference registration payment`,
}

async function PaymentContent({ searchParams }: { searchParams: Promise<{ type?: string; paymentId?: string }> }) {
  const params = await searchParams
  const isWorkshopAddon = params.type === 'workshop-addon'
  
  if (isWorkshopAddon) {
    return <WorkshopPayment />
  }
  
  return <DashboardPaymentForm />
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: conferenceConfig.theme.primary }} />
        <p className="text-slate-600 dark:text-slate-400">Loading payment...</p>
      </div>
    </div>
  )
}

export default function PaymentPage({ searchParams }: { searchParams: Promise<{ type?: string; paymentId?: string }> }) {
  return (
    <ProtectedRoute>
      <MainLayout currentPage="payment" showSearch={false}>
        <Suspense fallback={<LoadingFallback />}>
          <PaymentContent searchParams={searchParams} />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  )
}