"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/abstracts')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to abstracts page...</p>
      </div>
    </div>
  )
}


