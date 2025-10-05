'use client';

export default function Contact() {
  const socialLinks = [
    {
      name: 'GitHub',
      username: 'theunseenchapter',
      url: 'https://github.com/theunseenchapter',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
        </svg>
      ),
      color: 'from-gray-700 to-gray-900',
    },
    {
      name: 'LinkedIn',
      username: 'vivekyadav03',
      url: 'https://www.linkedin.com/in/vivekyadav03',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'from-blue-600 to-blue-800',
    },
  ];

  return (
    <section id="contact" className="section-spacing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Let's <span className="text-gradient">Connect</span>
          </h2>
          <p className="text-xl text-slate-600">
            Find me on these platforms
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-effect rounded-2xl p-10 card-hover group text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white mb-6 group-hover:animate-float`}>
                {link.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-gradient transition-all">
                {link.name}
              </h3>
              <p className="text-blue-600 font-medium text-lg">
                @{link.username}
              </p>
            </a>
          ))}
        </div>

        <div className="text-center mt-16 glass-effect rounded-2xl p-10 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-slate-800 mb-4">
            Open for Opportunities
          </h3>
          <p className="text-lg text-slate-600 leading-relaxed">
            I'm always excited to collaborate on innovative projects and explore new opportunities. 
            Whether it's a full-time role, internship, or freelance work, feel free to reach out!
          </p>
        </div>
      </div>
    </section>
  );
}
