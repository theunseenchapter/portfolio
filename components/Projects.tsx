'use client';

export default function Projects() {
  const projects = [
    {
      title: 'Medisource',
      description: 'AI-powered medical information platform using NLP for accurate healthcare insights. Built with advanced natural language processing to provide reliable medical information.',
      tech: ['AI', 'NLP', 'Python', 'Machine Learning'],
      link: 'https://medisourceai.vercel.app',
      color: 'from-blue-400 to-cyan-400'
    },
    {
      title: 'Home Alchemy',
      description: 'Interior design generator powered by Stable Diffusion AI. Transform your space with AI-generated interior design concepts and visualizations.',
      tech: ['Stable Diffusion', 'AI', 'Python', 'Computer Vision'],
      link: 'https://github.com/theunseenchapter/home-alchemy',
      color: 'from-purple-400 to-pink-400'
    },
    {
      title: 'Book Re-Lease',
      description: 'Full-stack book sharing platform built with MERN stack. Connect with readers, share books, and build a community of book lovers.',
      tech: ['MongoDB', 'Express', 'React', 'Node.js'],
      link: 'https://bookrelease.vercel.app',
      color: 'from-indigo-400 to-blue-400'
    },
  ];

  return (
    <section id="projects" className="section-spacing bg-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Featured <span className="text-gradient">Projects</span>
          </h2>
          <p className="text-xl text-slate-600">
            Building innovative solutions with cutting-edge technologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <a
              key={index}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-effect rounded-2xl p-8 card-hover group"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${project.color} mb-6 flex items-center justify-center text-white text-2xl font-bold group-hover:animate-float`}>
                {project.title.charAt(0)}
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-800 group-hover:text-gradient transition-all">
                {project.title}
              </h3>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-full text-sm font-medium border border-blue-200/50"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
