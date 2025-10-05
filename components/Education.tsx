'use client';

export default function Education() {
  const education = {
    degree: 'Bachelor of Engineering in Computer Engineering',
    institution: 'Lokmanya Tilak College of Engineering (LTCOE)',
    duration: '2022 - 2026',
    cgpa: '8.0 / 10',
  };

  const certifications = [
    {
      title: 'Machine Learning Specialization',
      issuer: 'Stanford Online',
      description: 'Comprehensive ML course covering supervised and unsupervised learning',
    },
    {
      title: 'Full Stack Web Development',
      issuer: 'Udemy',
      description: 'Complete MERN stack development and modern web technologies',
    },
    {
      title: 'Cloud Computing with GCP',
      issuer: 'Google Cloud',
      description: 'Cloud infrastructure, deployment, and scalable application development',
    },
  ];

  return (
    <section id="education" className="section-spacing bg-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Education & <span className="text-gradient">Certifications</span>
          </h2>
          <p className="text-xl text-slate-600">
            Academic background and professional learning
          </p>
        </div>

        <div className="glass-effect rounded-2xl p-10 mb-12 card-hover">
          <div className="flex items-start">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mr-6 flex-shrink-0">
              🎓
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {education.degree}
              </h3>
              <p className="text-lg text-slate-600 mb-2">
                {education.institution}
              </p>
              <div className="flex flex-wrap gap-4 text-slate-500">
                <span className="flex items-center">
                  <span className="mr-2">📅</span>
                  {education.duration}
                </span>
                <span className="flex items-center">
                  <span className="mr-2">⭐</span>
                  CGPA: {education.cgpa}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="glass-effect rounded-2xl p-6 card-hover"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold mb-4">
                ✓
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">
                {cert.title}
              </h4>
              <p className="text-blue-600 font-medium mb-3">
                {cert.issuer}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                {cert.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
