'use client';

import { useEffect } from 'react';

export function SWRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // SW registered successfully
          })
          .catch((registrationError) => {
            // SW registration failed
          });
      });
    }
  }, []);

  return null;
}
