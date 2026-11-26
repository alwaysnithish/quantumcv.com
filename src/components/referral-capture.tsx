'use client';

import { useEffect } from 'react';

/** Stores ?ref=CODE in a 30-day cookie so signup (OTP or Google) can credit the referrer. */
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase();
      if (ref && /^[A-Z0-9]{6,12}$/.test(ref)) {
        document.cookie = `qcv_ref=${ref}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax`;
      }
    } catch {}
  }, []);
  return null;
}
