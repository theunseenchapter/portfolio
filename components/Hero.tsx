'use client';

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center section-spacing pt-32">
      <div className="max-w-7xl mx-auto text-center">
        <div className="animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            Hi, I'm <span className="text-gradient">Vivek Yadav</span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-600 mb-4 font-light">
            Computer Engineering Student
          </p>
          <p className="text-xl md:text-2xl text-slate-500 mb-12 font-light">
            AI & ML Enthusiast | Full Stack Developer
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <a
              href="#projects"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:shadow-xl transition-all duration-300 hover:scale-105 glow-hover"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="px-8 py-4 glass-effect rounded-full font-medium text-slate-700 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Let's Connect
            </a>
          </div>

          <div className="flex justify-center gap-8 text-slate-400">
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">8.0</p>
              <p className="text-sm">CGPA</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">3+</p>
              <p className="text-sm">Projects</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gradient">10+</p>
              <p className="text-sm">Skills</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
