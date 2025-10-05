'use client';

import { useState, useEffect } from 'react';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Education', href: '#education' },
    { name: 'Leadership', href: '#leadership' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-effect shadow-lg py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#home" className="text-2xl font-bold text-gradient">
          VY
        </a>
        
        <ul className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden md:block px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
        >
          Get in Touch
        </a>
      </div>
    </nav>
  );
}
