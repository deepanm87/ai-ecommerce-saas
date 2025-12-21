"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Lightbulb,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SalesTrends {
  summary: string
  highlights: string[]
  trend: "up" | "down" | "stable"
}

interface Inventory {
  summary: string
  alerts: string[]
  recommendations: string[]
}

interface ActionItems {
  urgent: string[]
  recommended: string[]
  opportunities: string[]
}

interface Insights {
  salesTrends: SalesTrends
  inventory: Inventory
  actionItems: ActionItems
}

interface RawMetrics {
  currentRevenue: number
  previousRevenue: number
  revenueChange: string
  orderCount: number
  avgOrderValue: string
  unfulfilledCount: number
  lowStockCount: number
}

interface InsightsResponse {
  success: boolean
  insights: Insights
  rawMetrics: RawMetrics
  generatedAt: string
  error?: string
}

function AIInsightsCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-centern justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="space-y-3"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-emerald-500" />
  }
  if (trend === "down") {
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }
  return <Minus className="h-4 w-4 text-zinc-400" />
}

export function AIInsightsCard() {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading,setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const hasFetched = useRef(false)

  const fetchInsights = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetch("/api/admin/insights")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch insights")
      }

      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) {
      return
    }
    hasFetched.current = true
    fetchInsights()
  }, [fetchInsights])

  if (loading) {
    return <AIInsightsCardSkeleton />
  }

  


}



