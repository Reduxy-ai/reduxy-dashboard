'use client';

import React, { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/auth';

interface FeedbackStatsData {
    total_feedback: number;
    by_type: Record<string, number>;
    by_entity_type: Record<string, number>;
    accuracy_estimate: number;
    period: string;
}

interface FeedbackStatsProps {
    gatewayUrl?: string;
    apiKey?: string;
    refreshInterval?: number; // in milliseconds, 0 to disable
}

export function FeedbackStats({
    gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://reduxy-gateway-zoeaq6fbnq-uc.a.run.app',
    apiKey,
    refreshInterval = 0
}: FeedbackStatsProps) {
    const [stats, setStats] = useState<FeedbackStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const token = apiKey || getAuthToken();
            if (!token) {
                setError('No authentication token available');
                return;
            }

            const response = await fetch(`${gatewayUrl}/feedback/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchStats, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [gatewayUrl, apiKey, refreshInterval]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-800">
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            </div>
        );
    }

    if (!stats || stats.total_feedback === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Feedback Statistics
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No feedback collected yet. Start by testing detections in the Test Lab.
                </p>
            </div>
        );
    }

    const feedbackColors: Record<string, string> = {
        correct: 'bg-green-500',
        wrong_type: 'bg-yellow-500',
        not_pii: 'bg-red-500',
        missed_pii: 'bg-amber-500',
        partial: 'bg-blue-500'
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Feedback Statistics
                </h3>
                <button
                    onClick={fetchStats}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                    Refresh
                </button>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total_feedback}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total Feedback
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(stats.accuracy_estimate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Marked as Correct
                    </div>
                </div>
            </div>

            {/* By Feedback Type */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    By Feedback Type
                </h4>
                <div className="space-y-2">
                    {Object.entries(stats.by_type).map(([type, count]) => {
                        const percentage = (count / stats.total_feedback) * 100;
                        return (
                            <div key={type} className="flex items-center gap-2">
                                <div className="w-24 text-xs text-gray-600 dark:text-gray-400 capitalize">
                                    {type.replace('_', ' ')}
                                </div>
                                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${feedbackColors[type] || 'bg-gray-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="w-12 text-xs text-right text-gray-600 dark:text-gray-400">
                                    {count}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* By Entity Type */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    By Entity Type
                </h4>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.by_entity_type)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                            <span
                                key={type}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                            >
                                {type}: {count}
                            </span>
                        ))}
                </div>
            </div>
        </div>
    );
}

