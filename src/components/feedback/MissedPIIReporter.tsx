'use client';

import React, { useState } from 'react';
import { getAuthToken } from '@/lib/auth';

interface MissedPIIReporterProps {
    originalText: string;
    documentType?: string;
    onReported?: () => void;
    gatewayUrl?: string;
    apiKey?: string;
}

const ENTITY_TYPES = [
    'PERSON', 'FIRST_NAME', 'LAST_NAME',
    'EMAIL', 'PHONE', 'ADDRESS',
    'SSN', 'CREDIT_CARD',
    'DATE', 'IP_ADDRESS',
    'ORG', 'GPE', 'OTHER'
];

export function MissedPIIReporter({
    originalText,
    documentType = 'text',
    onReported,
    gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://reduxy-gateway-zoeaq6fbnq-uc.a.run.app',
    apiKey
}: MissedPIIReporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [missedValue, setMissedValue] = useState('');
    const [entityType, setEntityType] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!missedValue || !entityType) return;

        setSubmitting(true);
        setError(null);

        try {
            const token = apiKey || getAuthToken();
            if (!token) {
                setError('No authentication token available');
                return;
            }

            // Try to find position in original text
            const startPosition = originalText.toLowerCase().indexOf(missedValue.toLowerCase());
            const endPosition = startPosition >= 0 ? startPosition + missedValue.length : undefined;

            const response = await fetch(`${gatewayUrl}/feedback/missed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    original_text: originalText.substring(0, 1000),
                    missed_value: missedValue,
                    correct_entity_type: entityType,
                    start_position: startPosition >= 0 ? startPosition : undefined,
                    end_position: endPosition,
                    document_type: documentType,
                    notes: notes || undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit report');
            }

            setSubmitted(true);
            setMissedValue('');
            setEntityType('');
            setNotes('');
            onReported?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setMissedValue('');
        setEntityType('');
        setNotes('');
        setError(null);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Report Missed PII</span>
            </button>
        );
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Report Missed PII Detection
                </h4>
                <button
                    onClick={() => {
                        setIsOpen(false);
                        handleReset();
                    }}
                    className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {submitted ? (
                <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Report Submitted</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Thank you for helping improve detection accuracy!
                    </p>
                    <button
                        onClick={handleReset}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                    >
                        Report Another
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-amber-800 dark:text-amber-200 block mb-1">
                            Missed PII Value *
                        </label>
                        <input
                            type="text"
                            value={missedValue}
                            onChange={(e) => setMissedValue(e.target.value)}
                            placeholder="Enter the PII that was not detected"
                            className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-amber-800 dark:text-amber-200 block mb-1">
                            Entity Type *
                        </label>
                        <select
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">Select entity type...</option>
                            {ENTITY_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-amber-800 dark:text-amber-200 block mb-1">
                            Additional Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional context that might help..."
                            className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                handleReset();
                            }}
                            className="px-4 py-2 text-sm text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!missedValue || !entityType || submitting}
                            className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

