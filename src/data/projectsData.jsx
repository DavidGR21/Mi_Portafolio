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
// media:     (opcional) galería de capturas y videos. Se genera optimizada con
//              npm run media -- <slug>        (originales en media-src/<slug>/)
//            y el comando imprime el bloque projectMedia(...) listo para pegar aquí.
//            Cada elemento: [tipo "image" | "video", nombre de archivo sin extensión, pie de foto]

// Construye las rutas de la galería a partir de la carpeta del proyecto:
//   imagen -> <carpeta>/<nombre>.webp           miniatura -> <carpeta>/thumbs/<nombre>.webp
//   video  -> <carpeta>/<nombre>.mp4 + póster   miniatura -> <carpeta>/thumbs/<nombre>.webp
const projectMedia = (folder, items) =>
    items.map(([type, name, caption]) => ({
        type,
        caption,
        thumb: `${folder}/thumbs/${name}.webp`,
        ...(type === "video"
            ? { src: `${folder}/${name}.mp4`, poster: `${folder}/${name}-poster.webp` }
            : { src: `${folder}/${name}.webp` }),
    }));

export const projectsData = [
    {
        id: 1,
        title: "iBlogTwo",
        description:
            "A blog-style social network where users publish posts with images, react, comment, add friends and chat. Posts, reactions and messages arrive live over WebSockets on top of a REST API.",
        image: "assets/images/projects/iBlogTwo.webp",
        media: projectMedia("assets/projects/iBlogTwo", [
            ["video", "promo", "Promo trailer"],
            ["image", "01-login", "Login"],
            ["image", "02-registro", "Sign up"],
            ["image", "03-inicio", "Home feed — create a post"],
            ["image", "04-busqueda", "People search"],
            ["image", "05-reacciones", "Reactions"],
            ["image", "06-comentarios", "Comments & replies"],
            ["image", "07-amigos", "Friends & requests"],
            ["image", "08-chat", "Real-time chat"],
            ["image", "09-stickers", "Stickers"],
            ["image", "10-perfil", "Profile"],
            ["image", "11-ajustes", "Profile settings"],
            ["image", "12-admin", "Admin dashboard"],
            ["image", "13-admin-usuarios", "User management"],
        ]),
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
        image: "assets/images/projects/virtualPet.webp",
        media: projectMedia("assets/projects/virtualPet", [
            ["video", "gameplay", "Gameplay trailer"],
            ["image", "01-menu-principal", "Main menu"],
            ["image", "02-selector-partidas", "Save slots"],
            ["image", "03-sala", "Living room"],
            ["image", "04-cocina", "Kitchen — feeding"],
            ["image", "05-bano", "Bathroom — hygiene"],
            ["image", "06-cuarto", "Bedroom — rest"],
            ["image", "07-tienda", "Shop"],
            ["image", "08-juego-memoria", "Memory mini-game"],
            ["image", "09-subir-nivel", "Level up"],
            ["image", "10-logros", "Achievements"],
            ["image", "11-mascota-muerta", "Game over"],
        ]),
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
        id: 5,
        title: "Ventas POO",
        description:
            "A desktop sales management application built in Java that helps track and manage sales, with all the data stored in a SQL database. Developed as an object-oriented programming project.",
        image: "assets/images/projects/Ventas.webp",
        media: projectMedia("assets/projects/VentasPO", [
            ["video", "App_de_Ventas_Trailer", "Trailer"],
            ["image", "01_inicio_de_sesion", "Login"],
            ["image", "02_menu_principal", "Main menu"],
            ["image", "03_productos_con_codigo_qr", "Products with QR codes"],
            ["image", "04_productos_nuevo_registro", "New product"],
            ["image", "05_clientes", "Customers"],
            ["image", "06_clientes_formulario", "Customer form"],
            ["image", "07_proveedores", "Suppliers"],
            ["image", "08_provincias", "Provinces"],
            ["image", "09_ciudades", "Cities"],
            ["image", "10_compra_validacion_proveedor", "Purchase — supplier validation"],
            ["image", "11_compra_detalle", "Purchase details"],
            ["image", "12_factura_validacion_cliente", "Invoice — customer validation"],
            ["image", "13_factura_detalle", "Invoice details"],
            ["image", "14_lista_ventas_qr", "Sales list with QR"],
            ["image", "15_lista_compras_qr", "Purchases list with QR"],
            ["image", "16_kardex_general", "General kardex"],
            ["image", "17_kardex_por_producto", "Kardex by product"],
            ["image", "18_gestion_de_usuarios", "User management"],
        ]),
        role: {
            type: "solo",
            summary: "Developed entirely on my own.",
        },
        stack: {
            Language: ["Java"],
            Database: ["SQL"],
        },
        practices: ["Object-Oriented Programming"],
        notes: [
            {
                type: "info",
                text: "One of my first projects, built at the beginning of my university studies.",
            },
        ],
        demo: "",
        source: "https://github.com/DavidGR21/App-de-Ventas.git",
    },
    {
        id: 6,
        title: "App Combustible",
        description:
            "A fuel, vehicle, driver and route management system built on microservices, with an API Gateway, gRPC communication, JWT authentication and one database per service, all containerized with Docker.",
        image: "assets/images/projects/Combustible.webp",
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
        image: "assets/images/projects/Hospital.webp",
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
        image: "assets/images/projects/PixelOdysey.webp",
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
