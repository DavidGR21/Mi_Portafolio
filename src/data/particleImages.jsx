/**
 * Configuración de imágenes para el componente ParticleLogo
 * 
 * Cada imagen debe estar en formato que contraste bien con el fondo
 * (por ejemplo, negro sobre transparente o blanco sobre transparente)
 * 
 * Estructura:
 * - id: identificador único
 * - path: ruta relativa desde src/
 * - name: nombre descriptivo (opcional)
 */

export const particleImages = [
  {
    id: "logo-vertical",
    path: "assets/images/logo/logoVerticalNegroCopy.png",
    name: "Logo Vertical"
  },
  {
    id: "dragon",
    path: "assets/images/logo/dragonParticle.png",
    name: "Dragon"
  },
  // Agrega más imágenes aquí según necesites
  {
    id: "logo-javascript",
    path: "assets/images/logo/javascript.png",
    name: "JavaScript"
  },
  {
    id: "logo-react",
    path: "assets/images/logo/React.png",
    name: "React"
  },
  {
    id: "logo-nodejs",
    path: "assets/images/logo/NodeJS.png",
    name: "Node.js"
  },
  {
    id: "logo-html",
    path: "assets/images/logo/HTML.png",
    name: "HTML"
  },
  {
    id: "logo-css",
    path: "assets/images/logo/CSS.png",
    name: "CSS"
  },
  {
    id: "logo-springboot",
    path: "assets/images/logo/SpringBoot.png",
    name: "Spring Boot"
  },
  {
    id: "logo-mysql",
    path: "assets/images/logo/MySQL.png",
    name: "MySQL"
  },
  {
    id: "logo-postgresql",
    path: "assets/images/logo/PostgreSQL.png",
    name: "PostgreSQL"
  },
  {
    id: "logo-github",
    path: "assets/images/logo/GitHub.png",
    name: "GitHub"
  },
  {
    id: "logo-aws",
    path: "assets/images/logo/AWS.png",
    name: "AWS"
  },
  {
    id: "logo-azure",
    path: "assets/images/logo/Azure.png",
    name: "Azure"
  },
  {
    id: "logo-docker",
    path: "assets/images/logo/Docker.png",
    name: "Docker"
  },
  {
    id: "logo-uta",
    path: "assets/images/logo/UTA.png",
    name: "Universidad Técnica de Ambato"
  },
  {
    id: "logo-freelance",
    path: "assets/images/logo/Freelance.png",
    name: "Freelance"
  }
];

// Índice de la imagen por defecto (se muestra al cargar)
export const DEFAULT_IMAGE_INDEX = 0;

// Índice de la imagen al hacer hover
export const HOVER_IMAGE_INDEX = 1;

// Si quieres usar múltiples imágenes en secuencia (ciclo automático),
// exporta un array con los índices en el orden deseado
export const IMAGE_SEQUENCE = [0, 1]; // Por ahora solo 2 imágenes
