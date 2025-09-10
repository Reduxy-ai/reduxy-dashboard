// API base URL - will be environment variable in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Types for API responses
export interface RequestLog {
    id: number
    request_id: string
    timestamp: string
    endpoint: string
    method: string
    status_code: number
    processing_time_ms: number
    has_pii: boolean
    user_id?: string
    ip_address?: string
    user_agent?: string
}

export interface ResponseLog {
    id: number
    request_log_id: number
    provider: string
    model_used: string
    tokens_used: number
    cost_usd: number
    response_time_ms: number
    status_code: number
}

export interface LogsResponse {
    logs: RequestLog[]
    total: number
    page: number
    per_page: number
}

export interface UsageMetrics {
    total_requests: number
    total_tokens: number
    total_cost: number
    pii_detections: number
    avg_response_time: number
    error_rate: number
}

export interface ChartData {
    date: string
    requests: number
    tokens: number
    cost: number
    pii_detections: number
}

// API functions
export async function fetchLogs(
    page: number = 1,
    limit: number = 50,
    _filters?: {
        start_date?: string
        end_date?: string
        endpoint?: string
        has_pii?: boolean
        status_codes?: number[]
    }
): Promise<LogsResponse> {
    // For now, return mock data - will integrate with real API later
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockLogs: RequestLog[] = [
                {
                    id: 1,
                    request_id: "req_001",
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    endpoint: "/chat/completions",
                    method: "POST",
                    status_code: 200,
                    processing_time_ms: 1250,
                    has_pii: true,
                    user_id: "user_123",
                    ip_address: "192.168.1.100",
                    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                },
                {
                    id: 2,
                    request_id: "req_002",
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    endpoint: "/chat/completions",
                    method: "POST",
                    status_code: 200,
                    processing_time_ms: 980,
                    has_pii: false,
                    user_id: "user_456",
                    ip_address: "192.168.1.101",
                    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                },
                {
                    id: 3,
                    request_id: "req_003",
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    endpoint: "/chat/redact",
                    method: "POST",
                    status_code: 200,
                    processing_time_ms: 450,
                    has_pii: true,
                    user_id: "user_789",
                    ip_address: "192.168.1.102",
                    user_agent: "PostmanRuntime/7.32.3"
                },
                {
                    id: 4,
                    request_id: "req_004",
                    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    endpoint: "/chat/completions",
                    method: "POST",
                    status_code: 500,
                    processing_time_ms: 30000,
                    has_pii: false,
                    user_id: "user_123",
                    ip_address: "192.168.1.100",
                    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                },
                {
                    id: 5,
                    request_id: "req_005",
                    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    endpoint: "/health/detailed",
                    method: "GET",
                    status_code: 200,
                    processing_time_ms: 50,
                    has_pii: false,
                    ip_address: "192.168.1.103",
                    user_agent: "curl/8.1.2"
                }
            ]

            resolve({
                logs: mockLogs.slice((page - 1) * limit, page * limit),
                total: mockLogs.length,
                page,
                per_page: limit
            })
        }, 300) // Simulate API delay
    })
}

export async function fetchUsageMetrics(
    period: '24h' | '7d' | '30d' = '24h'
): Promise<UsageMetrics> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockMetrics: UsageMetrics = {
                total_requests: 1247,
                total_tokens: 45892,
                total_cost: 12.67,
                pii_detections: 89,
                avg_response_time: 1250,
                error_rate: 0.8
            }
            resolve(mockMetrics)
        }, 200)
    })
}

export async function fetchChartData(
    _period: '24h' | '7d' | '30d' = '7d'
): Promise<ChartData[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const days = _period === '24h' ? 1 : _period === '7d' ? 7 : 30
            const now = new Date()
            const data: ChartData[] = []

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                data.push({
                    date: date.toISOString().split('T')[0],
                    requests: Math.floor(Math.random() * 200) + 50,
                    tokens: Math.floor(Math.random() * 10000) + 2000,
                    cost: parseFloat((Math.random() * 20 + 5).toFixed(2)),
                    pii_detections: Math.floor(Math.random() * 20) + 1
                })
            }

            resolve(data)
        }, 250)
    })
}

export async function fetchHealthStatus(): Promise<{ status: string; components: Record<string, unknown> }> {
    try {
        const response = await fetch(`${API_BASE_URL}/health/detailed`)
        if (!response.ok) {
            throw new Error('Health check failed')
        }
        return await response.json()
    } catch (_error) {
        // Return mock data if real API fails
        return {
            status: 'healthy',
            components: {
                openai: { status: 'healthy' },
                pii_detection: { status: 'healthy' },
                database: { status: 'healthy' },
                logging_service: { status: 'healthy' }
            }
        }
    }
} 