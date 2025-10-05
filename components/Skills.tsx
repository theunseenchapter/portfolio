'use client';

import { useEffect, useState } from 'react';

export default function Skills() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('skills');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const skillCategories = [
    {
      title: 'Programming Languages',
      icon: '💻',
      color: 'from-blue-500 to-cyan-500',
      skills: [
        { name: 'Python', level: 95 },
        { name: 'JavaScript', level: 90 },
        { name: 'TypeScript', level: 85 },
        { name: 'C', level: 80 },
        { name: 'Java', level: 75 },
        { name: 'SQL', level: 85 },
      ]
    },
    {
      title: 'Web Development',
      icon: '🌐',
      color: 'from-purple-500 to-pink-500',
      skills: [
        { name: 'React', level: 92 },
        { name: 'Next.js', level: 90 },
        { name: 'Node.js', level: 88 },
        { name: 'Express', level: 85 },
        { name: 'Tailwind CSS', level: 95 },
        { name: 'HTML/CSS', level: 98 },
      ]
    },
    {
      title: 'AI & Machine Learning',
      icon: '🤖',
      color: 'from-indigo-500 to-purple-500',
      skills: [
        { name: 'PyTorch', level: 88 },
        { name: 'TensorFlow', level: 82 },
        { name: 'NLP', level: 85 },
        { name: 'Computer Vision', level: 80 },
        { name: 'Stable Diffusion', level: 87 },
      ]
    },
    {
      title: 'Tools & Technologies',
      icon: '🛠️',
      color: 'from-emerald-500 to-teal-500',
      skills: [
        { name: 'Docker', level: 83 },
        { name: 'Git', level: 92 },
        { name: 'GCP', level: 78 },
        { name: 'MongoDB', level: 85 },
        { name: 'REST APIs', level: 90 },
        { name: 'Vercel', level: 88 },
      ]
    },
  ];

  return (
    <section id="skills" className="section-spacing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Skills & <span className="text-gradient">Expertise</span>
          </h2>
          <p className="text-xl text-slate-600">
            Proficiency levels across different technologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {skillCategories.map((category, index) => (
            <div
              key={index}
              className="glass-effect rounded-2xl p-8 card-hover"
            >
              <div className="flex items-center mb-8">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl mr-4 flex-shrink-0`}>
                  {category.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {category.title}
                </h3>
              </div>
              
              <div className="space-y-5">
                {category.skills.map((skill, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700 font-medium">
                        {skill.name}
                      </span>
                      <span className="text-slate-500 text-sm font-semibold">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${category.color} rounded-full transition-all duration-1000 ease-out transform origin-left`}
                        style={{
                          width: isVisible ? `${skill.level}%` : '0%',
                          transitionDelay: `${i * 100}ms`
                        }}
                      >
                        <div className="h-full w-full bg-white/20 animate-shimmer" 
                          style={{
                            backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            backgroundSize: '200% 100%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
