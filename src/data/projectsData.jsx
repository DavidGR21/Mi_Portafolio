// source: un enlace (string) o, si el proyecto tiene dos repositorios,
// un objeto { frontend, backend } y se muestran por separado
//
// role:      { type: "solo" | "team", summary, collaborators? }
//            solo  -> lo desarrollé yo completo
//            team  -> proyecto en equipo; "collaborators": [{ name, url }] (el nombre enlaza a su portafolio)
// stack:     tecnologías agrupadas por categoría (Frontend, Backend, Database,
//            DevOps, Game, Tooling...). Se muestran como grupos en la pestaña "Stack".
// description: corta (unas 200 letras) para que quepa entera en el panel; si en una
//            pantalla pequeña se recorta, aparece "… more" y abre la descripción completa
// practices: metodologías, arquitecturas y patrones aplicados
// notes:     cosas a tener en cuenta (despliegue, tiempos de arranque, alcance...)
//            type: "info" | "warning"
export const projectsData = [
    {
        id: 1,
        title: "iBlogTwo",
        description:
            "A blog-style social network where users publish posts with images, react, comment, add friends and chat. Posts, reactions and messages arrive live over WebSockets on top of a REST API.",
        image: "assets/images/projects/iBlogTwo.png",
        role: {
            type: "solo",
            summary: "Designed and built the whole project: frontend, backend, database and deployment.",
        },
        stack: {
            Frontend: ["React", "Vite"],
            Backend: ["Node.js", "Express", "Socket.io (WebSockets)"],
            Database: ["Neon (PostgreSQL)"],
            Deploy: ["Vercel", "Render"],
        },
        practices: ["Real-time with WebSockets", "REST API", "Client–Server architecture"],
        notes: [
            {
                type: "warning",
                text: "The backend runs on Render's free tier, so it goes to sleep when idle. The first load can take a little while to wake up — after that it responds normally.",
            },
            {
                type: "info",
                text: "Real-time features are implemented with WebSockets instead of polling.",
            },
        ],
        demo: "https://iblogtwo.vercel.app/",
        source: {
            frontend: "https://github.com/DavidGR21/Frontend_iBlogTwo",
            backend: "https://github.com/DavidGR21/Backend_iBlogTwo",
        },
    },
    {
        id: 2,
        title: "Virtual Pet",
        description:
            "A Java program that simulates caring for a virtual pet: feed it and play with it while its hunger, happiness and energy change with every action. Neglect it and it can get sick or even leave.",
        image: "assets/images/projects/virtualPet.png",
        role: {
            type: "solo",
            summary: "Developed entirely on my own.",
        },
        stack: {
            Language: ["Java"],
        },
        practices: ["Object-Oriented Programming"],
        notes: [],
        demo: "",
        source: "https://github.com/DavidGR21/MascotaVirtualJAVA.git",
    },
    {
        id: 3,
        title: "Control NFC",
        description:
            "A web app that records student check-ins and check-outs with NFC. Scanning a student's tag reads their data and automatically logs the time and the event, replacing manual sign-in at schools.",
        image: "assets/images/projects/NFC.png",
        role: {
            type: "team",
            summary: "Built together with a teammate, sharing the work across the app.",
            collaborators: [{ name: "Michael", url: "https://xxxmichael.github.io/Portafolio/" }],
        },
        stack: {
            Frontend: ["React"],
            Backend: ["Python"],
            Database: ["SQL"],
        },
        practices: ["Collaborative development with Git"],
        notes: [
            {
                type: "info",
                text: "Mobile browsers restrict access to the NFC reader, so the app was exposed through Ngrok to make scanning work from a phone.",
            },
        ],
        demo: "",
        source: "https://github.com/xxxMichael/Nfc-detector.git",
    },
    {
        id: 4,
        title: "Gestor de Notas",
        description:
            "A note-taking application to create, edit and organize notes. A React interface talks to a Node.js REST API that stores every note in a SQL database, so they stay available between sessions.",
        image: "assets/images/projects/gestorNotas.png",
        role: {
            type: "team",
            summary: "Built together with a teammate, sharing the work across the app.",
            collaborators: [{ name: "Michael", url: "https://xxxmichael.github.io/Portafolio/" }],
        },
        stack: {
            Frontend: ["React"],
            Backend: ["Node.js"],
            Database: ["SQL"],
        },
        practices: ["Collaborative development with Git", "REST API"],
        notes: [],
        demo: "",
        source: "https://github.com/xxxMichael/Plataforma-Educativa.git",
    },
    {
        id: 5,
        title: "Ventas POO",
        description:
            "A desktop sales management application built in Java that helps track and manage sales, with all the data stored in a SQL database. Developed as an object-oriented programming project.",
        image: "assets/images/projects/Ventas.png",
        role: {
            type: "solo",
            summary: "Developed entirely on my own.",
        },
        stack: {
            Language: ["Java"],
            Database: ["SQL"],
        },
        practices: ["Object-Oriented Programming"],
        notes: [],
        demo: "",
        source: "https://github.com/DavidGR21/App-de-Ventas.git",
    },
    {
        id: 6,
        title: "App Combustible",
        description:
            "A fuel, vehicle, driver and route management system built on microservices, with an API Gateway, gRPC communication, JWT authentication and one database per service, all containerized with Docker.",
        image: "assets/images/projects/Combustible.jpg",
        role: {
            type: "team",
            summary: "Group project for the Distributed Applications course, built with classmates.",
            collaborators: [
                { name: "Paul Velastegui", url: "https://paul-23ve.github.io/" },
                { name: "Cristhian Hurtado", url: "https://github.com/ACHEDARK" },
                { name: "Michael", url: "https://xxxmichael.github.io/Portafolio/" },
            ],
        },
        stack: {
            Backend: [".NET", "C#", "REST API", "gRPC", "JWT"],
            Database: ["MySQL"],
            DevOps: ["Docker", "Docker Compose"],
        },
        practices: ["Microservices", "API Gateway", "Database-per-Service", "gRPC inter-service communication"],
        notes: [
            {
                type: "info",
                text: "Runs locally with Docker Compose; it is not deployed online, so there is no live demo.",
            },
        ],
        demo: "",
        source: {
            frontend: "https://github.com/GrupoDistribuidas/Frontend_ControlCombustible",
            backend: "https://github.com/GrupoDistribuidas/Backend_ControlCombustible",
        },
    },
    {
        id: 7,
        title: "App Hospital",
        description:
            "A distributed hospital management platform built on microservices: secure authentication, doctors, patients and specialties, consultation records, statistical reports and support for multiple branches.",
        image: "assets/images/projects/Hospital.jpg",
        role: {
            type: "team",
            summary: "Group project for the Distributed Applications course, built with classmates.",
            collaborators: [
                { name: "Paul Velastegui", url: "https://paul-23ve.github.io/" },
                { name: "Cristhian Hurtado", url: "https://github.com/ACHEDARK" },
                { name: "Michael", url: "https://xxxmichael.github.io/Portafolio/" },
            ],
        },
        stack: {
            Backend: [".NET", "C#", "REST API", "gRPC", "JWT", "Entity Framework Core", "Swagger"],
            Database: ["MySQL"],
            DevOps: ["Docker", "Docker Compose"],
        },
        practices: ["Microservices", "API Gateway", "gRPC inter-service communication", "Multi-branch support"],
        notes: [
            {
                type: "info",
                text: "Runs locally with Docker Compose; it is not deployed online, so there is no live demo.",
            },
        ],
        demo: "",
        source: {
            frontend: "https://github.com/GrupoDistribuidas/GestionHospitalariaFrontend",
            backend: "https://github.com/GrupoDistribuidas/GestionHospitalariaBackend",
        },
    },
    {
        id: 8,
        title: "Pixel Odyssey",
        description:
            "A 2D pixel-art platformer made in Unity 6 with a clean architecture: state-based movement, modular enemy AI, a multi-phase boss battle, a profile-based save system and centralized audio.",
        image: "assets/images/projects/PixelOdysey.jpeg",
        role: {
            type: "team",
            summary: "Developed as a team: game design, architecture and programming shared with my teammates.",
            collaborators: [
                { name: "Paul Velastegui", url: "https://paul-23ve.github.io/" },
                { name: "Michael", url: "https://xxxmichael.github.io/Portafolio/" },
            ],
        },
        stack: {
            Engine: ["Unity 6", "URP"],
            Language: ["C#"],
        },
        practices: [
            "Clean Architecture",
            "State Pattern",
            "Strategy Pattern",
            "Observer Pattern",
            "Singleton Pattern",
        ],
        notes: [],
        demo: "",
        source: "https://github.com/DavidGR21/Pixel-Odyssey.git",
    },
];

export default projectsData;
