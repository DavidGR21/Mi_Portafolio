export const aboutMeData = {
  name: "David Giler",
  role: "Full Stack Developer",
  description: `I'm a Full Stack Developer with a strong interest in software 
  architecture, distributed systems, and modern web technologies. I enjoy building 
  reliable backend services, intuitive user interfaces, and scalable solutions using 
  industry best practices. My goal is to create software that is maintainable, efficient, 
  and capable of delivering meaningful value to users.`,

  skills: [
    {
      name: "JavaScript",
      imageId: "logo-javascript" // Referencia a particleImages
    },
    {
      name: "React",
      imageId: "logo-react" // Referencia a particleImages
    },
    {
      name: "Node.js",
      imageId: "logo-nodejs" // Referencia a particleImages
    },
    {
      name: "HTML",
      imageId: "logo-html" // Referencia a particleImages
    },
    {
      name: "CSS",
      imageId: "logo-css" // Referencia a particleImages
    },
    {
      name: "Spring Boot",
      imageId: "logo-springboot" // Referencia a particleImages
    },
    {
      name: "MySQL",
      imageId: "logo-mysql" // Referencia a particleImages
    },
    {
      name: "PostgreSQL",
      imageId: "logo-postgresql" // Referencia a particleImages
    },
    {
      name: "Git-Hub",
      imageId: "logo-github" // Referencia a particleImages
    },
    {
      name: "AWS",
      imageId: "logo-aws" // Referencia a particleImages
    },
    {
      name: "Azure",
      imageId: "logo-azure" // Referencia a particleImages
    },
    {
      name: "Docker",
      imageId: "logo-docker" // Referencia a particleImages
    },
    {
      name: "Python",
      imageId: "logo-python" // Referencia a particleImages
    }
  ],

  experience: [
    {
      id: 1,
      title: "Full Stack Developer",
      company: "Freelance",
      period: "2024 - 2026",
      description: "Development of custom web applications for various clients.",
      imageId: "logo-freelance"
    },
    {
      id: 2,
      title: "Developer Intern",
      company: "EEASA",
      period: "2026 - Present",
      description: "Web application developer for the company's finance department.",
      imageId: "logo-eeasa"
    }
  ],

  education: [
    {
      id: 1,
      institution: "Universidad Técnica de Ambato",
      degree: "Software Engineering",
      period: "2022 - 2027",
      imageId: "logo-uta"
    }
  ],

  // Los PDF van en public/assets/certificates/ (certificate: ruta relativa desde public/)
  courses: [
    {
      id: 1,
      title: "Fundamentos de Python 1",
      provider: "Networking Academy",
      period: "2026",
      certificate: "assets/certificates/certificadoCursoPython.pdf",
      imageId: "logo-python"
    }
  ]
};
