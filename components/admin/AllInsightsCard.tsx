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
      
    </div>
  )
}



