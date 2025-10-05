'use client';

export default function Experience() {
  const experience = {
    role: 'Vice President',
    organization: 'Computer Engineering Student Association',
    duration: '2023 - Present',
    description: 'Leading a team of students to organize technical events, workshops, and hackathons. Fostering a collaborative learning environment and bridging the gap between academia and industry.',
    achievements: [
      'Organized 10+ technical workshops and seminars',
      'Led team of 20+ members across multiple departments',
      'Increased student participation by 40% in technical events',
      'Established partnerships with tech companies for internships',
    ],
  };

  return (
    <section id="leadership" className="section-spacing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Leadership & <span className="text-gradient">Experience</span>
          </h2>
          <p className="text-xl text-slate-600">
            Making an impact through collaboration and innovation
          </p>
        </div>

        <div className="glass-effect rounded-2xl p-10 card-hover">
          <div className="flex items-start mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mr-6 flex-shrink-0">
              👨‍💼
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-slate-800 mb-2">
                {experience.role}
              </h3>
              <p className="text-xl text-blue-600 font-medium mb-2">
                {experience.organization}
              </p>
              <p className="text-slate-500 flex items-center">
                <span className="mr-2">📅</span>
                {experience.duration}
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            {experience.description}
          </p>

          <div className="space-y-3">
            <h4 className="text-xl font-bold text-slate-800 mb-4">
              Key Achievements
            </h4>
            {experience.achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-start p-4 glass-effect rounded-lg hover:shadow-md transition-all duration-200"
              >
                <span className="text-blue-600 mr-3 text-xl flex-shrink-0">✓</span>
                <p className="text-slate-700">{achievement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
