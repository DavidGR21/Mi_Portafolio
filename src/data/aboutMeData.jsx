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

  // imageId: referencia a particleImages (src/data/particleImages.jsx)
  skills: [
    // Lenguajes
    { name: "JavaScript", imageId: "logo-javascript" },
    { name: "Java", imageId: "logo-java" },
    { name: "C#", imageId: "logo-csharp" },
    { name: "Python", imageId: "logo-python" },
    // Frontend
    { name: "React", imageId: "logo-react" },
    { name: "Vite", imageId: "logo-vite" },
    { name: "HTML", imageId: "logo-html" },
    { name: "CSS", imageId: "logo-css" },
    // Backend
    { name: "Node.js", imageId: "logo-nodejs" },
    { name: "Socket.io", imageId: "logo-socketio" },
    { name: "Spring Boot", imageId: "logo-springboot" },
    { name: ".NET", imageId: "logo-dotnet" },
    { name: "gRPC", imageId: "logo-grpc" },
    { name: "Swagger", imageId: "logo-swagger" },
    // Bases de datos
    { name: "MySQL", imageId: "logo-mysql" },
    { name: "PostgreSQL", imageId: "logo-postgresql" },
    // DevOps y nube
    { name: "Docker", imageId: "logo-docker" },
    { name: "GitHub", imageId: "logo-github" },
    { name: "AWS", imageId: "logo-aws" },
    { name: "Azure", imageId: "logo-azure" },
    // Videojuegos
    { name: "Unity", imageId: "logo-unity" }
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
