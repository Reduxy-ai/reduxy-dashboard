'use client';

import React, { useState } from 'react';
import { getAuthToken } from '@/lib/auth';

// Types
interface Detection {
    entity_type: string;
    value: string;
    confidence: number;
    start?: number;
    end?: number;
}

interface FeedbackWidgetProps {
    detection: Detection;
    originalText: string;
    documentType?: string;
    onFeedbackSubmitted?: () => void;
    gatewayUrl?: string;
    apiKey?: string;
}

type FeedbackType = 'correct' | 'wrong_type' | 'not_pii' | 'partial';

const ENTITY_TYPES = [
    'PERSON', 'FIRST_NAME', 'LAST_NAME',
    'EMAIL', 'PHONE', 'ADDRESS',
    'SSN', 'CREDIT_CARD',
    'DATE', 'IP_ADDRESS',
    'ORG', 'GPE', 'OTHER'
];

export function FeedbackWidget({
    detection,
    originalText,
    documentType = 'text',
    onFeedbackSubmitted,
    gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://reduxy-gateway-zoeaq6fbnq-uc.a.run.app',
    apiKey
}: FeedbackWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
    const [correctEntityType, setCorrectEntityType] = useState<string>('');
    const [correctValue, setCorrectValue] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!feedbackType) return;

        setSubmitting(true);
        setError(null);

        try {
            const token = apiKey || getAuthToken();
            if (!token) {
                setError('No authentication token available');
                return;
            }

            // Extract context
            const contextWindow = 100;
            const start = Math.max(0, (detection.start || 0) - contextWindow);
            const end = Math.min(originalText.length, (detection.end || originalText.length) + contextWindow);
            const contextBefore = originalText.substring(start, detection.start || 0);
            const contextAfter = originalText.substring(detection.end || 0, end);

            const response = await fetch(`${gatewayUrl}/feedback/detection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    original_text: originalText.substring(0, 1000), // Limit size
                    detected_value: detection.value,
                    detected_entity_type: detection.entity_type,
                    original_confidence: detection.confidence,
                    feedback_type: feedbackType,
                    correct_entity_type: feedbackType === 'wrong_type' ? correctEntityType : undefined,
                    correct_value: feedbackType === 'partial' ? correctValue : undefined,
                    context_before: contextBefore,
                    context_after: contextAfter,
                    document_type: documentType,
                    notes: notes || undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit feedback');
            }

            setSubmitted(true);
            onFeedbackSubmitted?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Feedback submitted</span>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
                Report issue
            </button>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-2 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Detection Feedback
                </h4>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                <span className="font-medium">{detection.entity_type}</span>: {detection.value}
            </div>

            {/* Feedback type selection */}
            <div className="space-y-2 mb-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    What's wrong with this detection?
                </label>
                <div className="flex flex-wrap gap-2">
                    {[
                        { type: 'correct' as FeedbackType, label: '✓ Correct', color: 'green' },
                        { type: 'wrong_type' as FeedbackType, label: 'Wrong Type', color: 'yellow' },
                        { type: 'not_pii' as FeedbackType, label: 'Not PII', color: 'red' },
                        { type: 'partial' as FeedbackType, label: 'Partial', color: 'blue' }
                    ].map(({ type, label, color }) => (
                        <button
                            key={type}
                            onClick={() => setFeedbackType(type)}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                feedbackType === type
                                    ? `bg-${color}-100 border-${color}-500 text-${color}-700 dark:bg-${color}-900 dark:text-${color}-300`
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                            }`}
                            style={feedbackType === type ? {
                                backgroundColor: color === 'green' ? '#dcfce7' : 
                                                 color === 'yellow' ? '#fef9c3' : 
                                                 color === 'red' ? '#fee2e2' : '#dbeafe',
                                borderColor: color === 'green' ? '#22c55e' : 
                                            color === 'yellow' ? '#eab308' : 
                                            color === 'red' ? '#ef4444' : '#3b82f6',
                                color: color === 'green' ? '#15803d' : 
                                      color === 'yellow' ? '#a16207' : 
                                      color === 'red' ? '#b91c1c' : '#1d4ed8'
                            } : {}}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conditional fields based on feedback type */}
            {feedbackType === 'wrong_type' && (
                <div className="mb-3">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                        Correct Entity Type
                    </label>
                    <select
                        value={correctEntityType}
                        onChange={(e) => setCorrectEntityType(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select type...</option>
                        {ENTITY_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            )}

            {feedbackType === 'partial' && (
                <div className="mb-3">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                        Correct Value
                    </label>
                    <input
                        type="text"
                        value={correctValue}
                        onChange={(e) => setCorrectValue(e.target.value)}
                        placeholder="Enter the complete/correct value"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            )}

            {/* Notes field */}
            <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Additional Notes (optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional context..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={2}
                />
            </div>

            {error && (
                <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                    {error}
                </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!feedbackType || submitting}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </div>
        </div>
    );
}

