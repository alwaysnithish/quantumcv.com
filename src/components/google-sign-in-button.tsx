'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Renders the official "Sign in with Google" button using Google Identity
 * Services (GIS) — the modern replacement for the old gapi/OAuth2 popup flow.
 * The client_id is safe to expose publicly (NEXT_PUBLIC_...); it identifies
 * the app, not a secret.
 */
export default function GoogleSignInButton() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    async function handleCredentialResponse(response: { credential: string }) {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.redirect ?? '/dashboard');
      } else {
        console.error('Google sign-in failed:', data.message);
      }
    }

    function init() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    }

    if (window.google) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [router]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return <div ref={buttonRef} className="flex justify-center" />;
}
