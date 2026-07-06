import { useState, useEffect } from "react";

export default function WelcomeScreen({ onFinished }) {
  // Estados para controlar las apariciones secuenciales
  const [mostrarTitulo, setMostrarTitulo] = useState(false);
  const [mostrarMexico, setMostrarMexico] = useState(false);
  const [mostrarEEUU, setMostrarEEUU] = useState(false);
  const [mostrarCanada, setMostrarCanada] = useState(false);
  const [iniciarCuentaRegresiva, setIniciarCuentaRegresiva] = useState(false);
  const [contador, setContador] = useState(5);

  useEffect(() => {
    // Secuencia de tiempos para la revelación de elementos
    const tiempoTitulo = setTimeout(() => setMostrarTitulo(true), 2000); // 2 segundos
    const tiempoMexico = setTimeout(() => setMostrarMexico(true), 4000); // 4 segundos
    const tiempoEEUU = setTimeout(() => setMostrarEEUU(true), 5000);   // 5 segundos
    const tiempoCanada = setTimeout(() => setMostrarCanada(true), 6000); // 6 segundos
    const tiempoContador = setTimeout(() => setIniciarCuentaRegresiva(true), 8000); // 8 segundos

    return () => {
      clearTimeout(tiempoTitulo);
      clearTimeout(tiempoMexico);
      clearTimeout(tiempoEEUU);
      clearTimeout(tiempoCanada);
      clearTimeout(tiempoContador);
    };
  }, []);

  // Manejo del contador estilo cine de 5 a 1
  useEffect(() => {
    if (!iniciarCuentaRegresiva) return;

    if (contador > 0) {
      const intervalo = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalo);
    } else {
      // Cuando llega a 0, se ejecuta la función que da paso a la web principal
      onFinished();
    }
  }, [iniciarCuentaRegresiva, text => contador]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden flex flex-col justify-between items-center p-8 select-none">
      
      {/* IMAGEN DE FONDO (Cargada desde /public) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform scale-100"
        style={{ backgroundImage: "url('/logomundial.jpg')" }}
      />
      
      {/* Capa de oscurecimiento sutil para que las letras y banderas resalten */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* 🏆 PARTE SUPERIOR: TÍTULO EN LETRAS QUE RESALTAN */}
      <div className="relative z-10 text-center mt-6 h-20">
        {mostrarTitulo && (
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] bg-gradient-to-b from-white via-gray-100 to-gray-300 bg-clip-text text-transparent animate-fade-in-up">
            2026 FIFA World Cup
          </h1>
        )}
      </div>

      {/* 🎬 PARTE CENTRAL: CONTADOR ESTILO PELÍCULA DE CINE */}
      <div className="relative z-10 flex items-center justify-center flex-1 w-full">
        {iniciarCuentaRegresiva && contador > 0 && (
          <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-black/70 border border-white/20 backdrop-blur-md shadow-2xl animate-scale-in">
            {/* Círculo que rodea el número */}
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-sky-500 fill-none stroke-[3] animate-circle"
              />
            </svg>
            {/* Número cambiante */}
            <span className="text-6xl font-black text-white font-mono drop-shadow-md">
              {contador}
            </span>
          </div>
        )}
      </div>

      {/* 🇲🇽 🇺🇸 🇨🇦 PARTE INFERIOR: BANDERAS CENTRADAS Y JUNTAS */}
      <div className="relative z-10 w-full flex flex-col items-center gap-4 mb-8">
        <div className="flex justify-center items-center gap-5 bg-black/50 px-6 py-4 rounded-2xl border border-white/10 backdrop-blur-xs shadow-xl min-h-[70px]">
          
          {/* Bandera México (Izquierda) */}
          {mostrarMexico && (
            <div className="animate-scale-in flex flex-col items-center gap-1.5">
              <img 
                src="/MEX.png" 
                alt="México" 
                className="w-16 md:w-20 rounded-md shadow-lg border border-white/10 object-cover aspect-[5/3]" 
              />
            </div>
          )}

          {/* Bandera Estados Unidos (Centro) */}
          {mostrarEEUU && (
            <div className="animate-scale-in flex flex-col items-center gap-1.5">
              <img 
                src="/USA.png" 
                alt="USA" 
                className="w-16 md:w-20 rounded-md shadow-lg border border-white/10 object-cover aspect-[5/3]" 
              />
            </div>
          )}

          {/* Bandera Canadá (Derecha) */}
          {mostrarCanada && (
            <div className="animate-scale-in flex flex-col items-center gap-1.5">
              <img 
                src="/CAN.png" 
                alt="Canadá" 
                className="w-16 md:w-20 rounded-md shadow-lg border border-white/10 object-cover aspect-[5/3]" 
              />
            </div>
          )}

        </div>
      </div>

    </div>
  );
}