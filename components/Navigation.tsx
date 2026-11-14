'use client';

import { useEffect, useState } from 'react';

const links = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b rule transition-colors ${scrolled ? 'bg-paper/90 backdrop-blur-md' : 'border-transparent'}`}>
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10" aria-label="Primary">
        <a href="#home" className="font-mono text-xs font-medium tracking-[0.16em]">VIVEK YADAV<span className="text-cobalt">®</span></a>
        <div className="flex items-center gap-5 md:gap-9">
          {links.map((link) => <a key={link.href} href={link.href} className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-cobalt">{link.label}</a>)}
        </div>
      </nav>
    </header>
  );
}
