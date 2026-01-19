'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        if (posthogKey && posthogHost) {
            posthog.init(posthogKey, {
                api_host: posthogHost,
                person_profiles: 'identified_only',
                capture_pageview: false, // Disable automatic pageview capture, as we capture manually
                capture_pageleave: true,
            });
        }
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
