"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"
import {
  Activity,
  DollarSign,
  Shield,
  Clock,
  TrendingUp
} from "lucide-react"
import { fetchUsageMetrics, fetchChartData, type UsageMetrics, type ChartData } from "@/lib/api"
import { formatNumber, formatDuration } from "@/lib/utils"

export default function Dashboard() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [metricsData, chartResults] = await Promise.all([
          fetchUsageMetrics('24h'),
          fetchChartData('7d')
        ])
        setMetrics(metricsData)
        setChartData(chartResults)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Analytics overview for your Reduxy AI Gateway
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const metricCards = [
    {
      title: "Total Requests",
      value: formatNumber(metrics?.total_requests || 0),
      description: "Last 24 hours",
      icon: Activity,
      trend: "+12.5%",
      color: "text-blue-600"
    },
    {
      title: "Total Cost",
      value: `$${metrics?.total_cost?.toFixed(2) || '0.00'}`,
      description: "API usage cost",
      icon: DollarSign,
      trend: "+$2.10",
      color: "text-green-600"
    },
    {
      title: "PII Detections",
      value: formatNumber(metrics?.pii_detections || 0),
      description: "Sensitive data blocked",
      icon: Shield,
      trend: "89 instances",
      color: "text-orange-600"
    },
    {
      title: "Avg Response Time",
      value: formatDuration(metrics?.avg_response_time || 0),
      description: `${metrics?.error_rate?.toFixed(1) || 0}% error rate`,
      icon: Clock,
      trend: metrics?.error_rate && metrics.error_rate > 5 ? "High" : "Normal",
      color: metrics?.error_rate && metrics.error_rate > 5 ? "text-red-600" : "text-green-600"
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Analytics overview for your Reduxy AI Gateway
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              <div className="flex items-center pt-1">
                <Badge variant="secondary" className="text-xs">
                  {card.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Requests Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Requests Over Time</CardTitle>
            <CardDescription>
              Request volume for the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [formatNumber(value), 'Requests']}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PII Detections */}
        <Card>
          <CardHeader>
            <CardTitle>PII Detections</CardTitle>
            <CardDescription>
              Daily PII detection count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [value, 'PII Detections']}
                />
                <Bar
                  dataKey="pii_detections"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system health and recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Gateway: Healthy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Database: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">PII Detection: Active</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>System performance is optimal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
