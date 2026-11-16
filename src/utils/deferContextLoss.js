// deferContextLoss.js
// Al desmontar un <Canvas>, @react-three/fiber llama a gl.forceContextLoss()
// 500 ms después para liberar la memoria de la GPU. Esa llamada es síncrona y
// espera a la GPU: si coincide con la animación de entrada de la sección
// siguiente (las partículas de About Me), congela la página 200-400 ms; con la
// GPU libre tarda menos de 10 ms.
//
// Uso: <Canvas onCreated={deferContextLoss}>. La pérdida del contexto se
// aplaza hasta que la nueva sección ha terminado de entrar y el navegador
// está desocupado.

const RELEASE_DELAY_MS = 3500;

export function deferContextLoss({ gl }) {
  const extension = gl.getContext().getExtension("WEBGL_lose_context");
  const idle = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 200));

  gl.forceContextLoss = () => {
    setTimeout(() => idle(() => extension?.loseContext()), RELEASE_DELAY_MS);
  };
}
