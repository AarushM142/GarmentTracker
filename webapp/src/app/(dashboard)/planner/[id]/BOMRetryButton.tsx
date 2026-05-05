'use client'

import { useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { retryBOM } from '../new-order/actions'
import { Button } from '@/components/ui/button'

export function BOMRetryButton({ poId }: { poId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    const res = await retryBOM(poId)
    setLoading(false)
    if (res?.error) setError(res.error)
  }

  return (
    <div className="mt-4">
      <Button 
        onClick={handleRetry} 
        loading={loading}
        variant="secondary"
        size="sm"
        className="w-full gap-2"
        icon={<RefreshCw className="w-4 h-4" />}
      >
        Retry BOM Calculation
      </Button>
      {error && (
        <p className="mt-2 text-[10px] font-bold text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}
