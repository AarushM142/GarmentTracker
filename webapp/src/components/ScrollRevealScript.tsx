'use client'

import { useEffect } from 'react'

export function ScrollRevealScript() {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    
    return () => io.disconnect();
  }, []);

  return null;
}
