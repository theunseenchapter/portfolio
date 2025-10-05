'use client';

export default function About() {
  const stats = [
    { label: 'Years Experience', value: '2+', icon: '📅' },
    { label: 'Projects Completed', value: '10+', icon: '🚀' },
    { label: 'Technologies', value: '15+', icon: '💻' },
    { label: 'CGPA', value: '8.0', icon: '⭐' },
  ];

  return (
    <section id="about" className="section-spacing bg-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            About <span className="text-gradient">Me</span>
          </h2>
          <p className="text-xl text-slate-600">
            Passionate about building innovative solutions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="glass-effect rounded-2xl p-10">
            <h3 className="text-3xl font-bold text-slate-800 mb-6">
              Turning Ideas Into Reality
            </h3>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                I'm a Computer Engineering student at LTCOE with a passion for artificial intelligence, 
                machine learning, and full-stack development. I believe in creating technology that makes 
                a meaningful impact on people's lives.
              </p>
              <p>
                With expertise in modern web technologies and AI frameworks, I've built projects ranging 
                from AI-powered healthcare platforms to interior design generators. I'm constantly exploring 
                new technologies and pushing the boundaries of what's possible.
              </p>
              <p>
                As Vice President of the Computer Engineering Student Association, I lead initiatives to 
                bridge the gap between academic learning and industry requirements, organizing workshops 
                and events that help students grow their skills.
              </p>
              <p>
                When I'm not coding, you'll find me exploring the latest developments in AI, contributing 
                to open-source projects, or mentoring fellow students in their tech journey.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass-effect rounded-2xl p-8 text-center card-hover"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
