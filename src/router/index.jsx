import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import Dashboard from '../pages/Dashboard'
import Equipos from '../pages/Equipos'
import Jugadores from '../pages/Jugadores'
import Partidos from '../pages/Partidos'
import Posiciones from '../pages/Posiciones'
import Goleadores from '../pages/Goleadores'
import WelcomeScreen from '../components/WelcomeScreen' // 👈 Importamos la pantalla de presentación

export default function Router() {
  // 🔥 Estado global para controlar si se muestra la intro o no
  const [mostrarIntro, setMostrarIntro] = useState(true)

  // Si la intro está activa, se adueña de la pantalla entera y no renderiza nada más
  if (mostrarIntro) {
    return <WelcomeScreen onFinished={() => setMostrarIntro(false)} />
  }

  // Una vez que llega a 0, desmonta el WelcomeScreen y arranca tu sistema completo
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/jugadores" element={<Jugadores />} />
          <Route path="/partidos" element={<Partidos />} />
          <Route path="/posiciones" element={<Posiciones />} />
          <Route path="/goleadores" element={<Goleadores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}