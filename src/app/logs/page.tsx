"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Search,
    ExternalLink
} from "lucide-react"
import { fetchLogs, type RequestLog } from "@/lib/api"
import { formatDuration } from "@/lib/utils"
import { format } from "date-fns"

export default function LogsPage() {
    const [logs, setLogs] = useState<RequestLog[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const logsPerPage = 20

    useEffect(() => {
        const loadLogs = async () => {
            setLoading(true)
            try {
                const response = await fetchLogs(currentPage, logsPerPage)
                setLogs(response.logs)
                setTotal(response.total)
                setTotalPages(Math.ceil(response.total / logsPerPage))
            } catch (error) {
                console.error('Failed to load logs:', error)
            } finally {
                setLoading(false)
            }
        }

        loadLogs()
    }, [currentPage])

    const getStatusBadge = (statusCode: number) => {
        if (statusCode >= 200 && statusCode < 300) {
            return <Badge variant="success">Success</Badge>
        } else if (statusCode >= 400 && statusCode < 500) {
            return <Badge variant="warning">Client Error</Badge>
        } else if (statusCode >= 500) {
            return <Badge variant="destructive">Server Error</Badge>
        }
        return <Badge variant="secondary">{statusCode}</Badge>
    }

    const getMethodBadge = (method: string) => {
        const colors = {
            GET: "bg-blue-500 text-white",
            POST: "bg-green-500 text-white",
            PUT: "bg-yellow-500 text-white",
            DELETE: "bg-red-500 text-white",
            PATCH: "bg-purple-500 text-white"
        }

        return (
            <Badge className={colors[method as keyof typeof colors] || "bg-gray-500 text-white"}>
                {method}
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Logs</h2>
                    <p className="text-muted-foreground">
                        View and analyze API request logs
                    </p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Logs</h2>
                    <p className="text-muted-foreground">
                        View and analyze API request logs
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Request Logs</CardTitle>
                    <CardDescription>
                        {total} total requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div key={log.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getMethodBadge(log.method)}
                                        <code className="text-sm bg-muted px-2 py-1 rounded">
                                            {log.endpoint}
                                        </code>
                                        {getStatusBadge(log.status_code)}
                                        {log.has_pii && (
                                            <Badge variant="warning">PII Detected</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDuration(log.processing_time_ms)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Request ID:</span>
                                        <div className="text-muted-foreground font-mono">
                                            {log.request_id}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium">Timestamp:</span>
                                        <div className="text-muted-foreground">
                                            {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium">User:</span>
                                        <div className="text-muted-foreground">
                                            {log.user_id || 'Anonymous'}
                                        </div>
                                    </div>
                                </div>

                                {log.ip_address && (
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                            <span>IP: {log.ip_address}</span>
                                            {log.user_agent && (
                                                <span className="truncate max-w-xs">
                                                    UA: {log.user_agent}
                                                </span>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            Details
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-6">
                        <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, total)} of {total} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>
                            <div className="flex items-center space-x-1">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const page = i + 1
                                    return (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </Button>
                                    )
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 