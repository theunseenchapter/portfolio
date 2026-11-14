'use client';

import { useEffect } from 'react';

export function Fx() {
  useEffect(() => {
    document.documentElement.classList.add('fx');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
    document.querySelectorAll('.rv').forEach((n) => io.observe(n));
    const move = (e: PointerEvent) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>('.card');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--x', `${e.clientX - r.left}px`);
      c.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    addEventListener('pointermove', move);
    return () => { io.disconnect(); removeEventListener('pointermove', move); };
  }, []);
  return null;
}
