'use client';

import { useEffect, useState } from 'react';

export type Currency = 'INR' | 'USD';

/**
 * Defaults to INR if the browser's timezone looks like India, USD
 * otherwise. This is a heuristic, not true geo-IP detection (which would
 * need an external API/service) — so a manual toggle is always shown
 * alongside it in the pricing UI, since timezone isn't a perfect signal
 * (VPNs, travellers, etc.).
 */
export function detectDefaultCurrency(): Currency {
  if (typeof window === 'undefined') return 'USD';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' ? 'INR' : 'USD';
  } catch {
    return 'USD';
  }
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCurrency(detectDefaultCurrency());
    setReady(true);
  }, []);

  return { currency, setCurrency, ready };
}

export function formatPrice(currency: Currency, amount: number): string {
  return currency === 'INR' ? `₹${amount}` : `$${amount}`;
}
