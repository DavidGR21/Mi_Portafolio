export const aboutMeData = {
  name: "David Giler",
  role: "Full Stack Developer",
  description: `I am a Full Stack software engineer who enjoys taking an idea from the database schema all 
  the way to the final user interface. My greatest strength lies in the backend: I design clean APIs, model data, 
  and structure services in a way that ensures they remain easy to maintain as they scale. On the frontend, 
  I strive to create intuitive, engaging, and innovative interfaces, characterized by fluid interactions, 
  purposeful animations, and robust performance.`,

  // Hoja de vida: el PDF vive en public/assets/CV. Para actualizarla basta con
  // reemplazar el archivo (o cambiar `file` si cambia el nombre)
  cv: {
    title: "Curriculum Vitae",
    subtitle: "David Giler · Full Stack Developer",
    file: "assets/CV/David_Giler_CV.pdf",
    downloadName: "David_Giler_CV.pdf",
    tags: ["PDF", "1 page", "Spanish"]
  },

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
      title: "Python Essentials 1",
      provider: "Networking Academy",
      period: "2026",
      certificate: "assets/certificates/certificadoCursoPython.pdf",
      imageId: "logo-python"
    },
    {
      id: 2,
      title: "Python Essentials 2",
      provider: "Networking Academy",
      period: "2026",
      certificate: "assets/certificates/certificadoCursoPython2.pdf",
      imageId: "logo-python"
    },
    {
      id: 3,
      title: "Fundamentals of Machine Learning and Artificial Intelligence",
      provider: "AWS Training & Certification",
      period: "2026",
      certificate: "assets/certificates/certificadoAWSFundamentalsMachineLearning.pdf",
      imageId: "logo-aws"
    },
    {
      id: 4,
      title: "Introduction to Cybersecurity",
      provider: "Networking Academy",
      period: "2024",
      certificate: "assets/certificates/IntroduccionCiberseguridad.pdf",
      imageId: "logo-cybersecurity"
    },
    {
      id: 5,
      title: "Network Support and Security",
      provider: "Networking Academy",
      period: "2024",
      certificate: "assets/certificates/SoporteSeguridad.pdf",
      imageId: "logo-cybersecurity"
    }
  ]
};
