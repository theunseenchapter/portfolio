'use client';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden px-5 pb-10 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-[1440px] flex-col justify-between">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="reveal-up">
            <p className="eyebrow mb-10">Independent software engineer / Mumbai, India</p>
            <h1 className="max-w-4xl font-editorial text-[clamp(4.5rem,12vw,11.5rem)] leading-[0.78] tracking-[-0.06em]">
              I build<br /><span className="ml-[12vw] text-cobalt">things.</span><br />I make them<br /><span className="ml-[7vw]">think.</span>
            </h1>
          </div>
          <div className="relative mx-auto w-full max-w-[520px] lg:mt-16">
            <div className="hero-object relative aspect-square rotate-[-8deg] bg-ink p-8 shadow-[24px_28px_0_var(--cobalt)] md:p-12">
              <div className="absolute inset-8 border border-paper/30 md:inset-12" />
              <div className="absolute left-[18%] top-[20%] h-[52%] w-[52%] rotate-[-25deg] border border-paper/70 bg-paper/10 backdrop-blur-sm" />
              <div className="absolute bottom-[18%] right-[17%] h-[38%] w-[38%] rotate-[27deg] border border-vermilion/80 bg-vermilion/20" />
              <p className="absolute bottom-8 left-8 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/60 md:bottom-12 md:left-12">Complexity / rendered legible</p>
              <span className="absolute right-8 top-8 font-editorial text-5xl text-paper md:right-12 md:top-12 md:text-7xl">01</span>
            </div>
          </div>
        </div>
        <div className="mt-20 flex items-end justify-between border-t rule pt-5">
          <p className="max-w-sm text-sm leading-6 text-muted">Software engineer working across intelligent systems, backend infrastructure and artificial intelligence.</p>
          <a href="#work" className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt md:block">Scroll to explore ↓</a>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted md:hidden">Scroll ↓</span>
        </div>
      </div>
    </section>
  );
}
