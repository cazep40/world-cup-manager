import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import Dashboard from '../pages/Dashboard'
import Equipos from '../pages/Equipos'
import Jugadores from '../pages/Jugadores'
import Partidos from '../pages/Partidos'
import Posiciones from '../pages/Posiciones'
import Goleadores from '../pages/Goleadores'
import Fixture from '../pages/Fixture' // 👈 1. Importamos la nueva página
import WelcomeScreen from '../components/WelcomeScreen'

export default function Router() {
  const [mostrarIntro, setMostrarIntro] = useState(true)

  if (mostrarIntro) {
    return <WelcomeScreen onFinished={() => setMostrarIntro(false)} />
  }

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
          <Route path="/fixture" element={<Fixture />} /> {/* 👈 2. Registramos la ruta /fixture */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}