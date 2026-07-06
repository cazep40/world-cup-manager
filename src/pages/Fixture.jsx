import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

export default function Fixture() {
  const [partidosEliminatorios, setPartidosEliminatorios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null)

  // Estados para el formulario del modal de eliminación directa
  const [golesLocal, setGolesLocal] = useState("0")
  const [golesVisitante, setGolesVisitante] = useState("0")
  const [golesProrrogaLocal, setGolesProrrogaLocal] = useState("0")
  const [golesProrrogaVisitante, setGolesProrrogaVisitante] = useState("0")
  const [penalesLocal, setPenalesLocal] = useState("")
  const [penalesVisitante, setPenalesVisitante] = useState("")

  useEffect(() => {
    getPartidosEliminatorios()
  }, [])

  async function getPartidosEliminatorios() {
    try {
      setLoading(true)
      // Traemos todos los partidos que NO pertenecen a la fase de grupos
      const { data, error } = await supabase
        .from("partidos")
        .select(`
          id, fecha, fase, goles_local, goles_visitante,
          goles_prorroga_local, goles_prorroga_visitante,
          penales_local, penales_visitante,
          local:equipos!partidos_local_id_fkey(nombre),
          visitante:equipos!partidos_visitante_id_fkey(nombre)
        `)
        .neq("fase", "FASE DE GRUPOS")
        .order("fecha", { ascending: true })

      if (error) throw error
      setPartidosEliminatorios(data || [])
    } catch (err) {
      console.error("Error al cargar las llaves:", err)
    } finally {
      setLoading(false)
    }
  }

  function abrirModalResultado(partido) {
    setPartidoSeleccionado(partido)
    setGolesLocal(partido.goles_local.toString())
    setGolesVisitante(partido.goles_visitante.toString())
    setGolesProrrogaLocal((partido.goles_prorroga_local || 0).toString())
    setGolesProrrogaVisitante((partido.goles_prorroga_visitante || 0).toString())
    setPenalesLocal(partido.penales_local !== null ? partido.penales_local.toString() : "")
    setPenalesVisitante(partido.penales_visitante !== null ? partido.penales_visitante.toString() : "")
    setModalAbierto(true)
  }

  // Agrupamos los partidos por fase para armar el árbol visual de forma limpia
  const filtrarPorFase = (faseNombre) => {
    return partidosEliminatorios.filter(p => p.fase.toUpperCase() === faseNombre.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-300 overflow-x-auto pb-12">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Fixture de Eliminación Directa</h2>
        <p className="text-sm font-medium text-gray-500 mt-1">
          Gestiona las llaves finales del torneo y define al Campeón del Mundo.
        </p>
      </div>

      {/* 🌲 ARBOL VISUAL DE LLAVES (Estructura en columnas de avance) */}
      <div className="flex gap-8 items-start min-w-[1200px] pt-4">
        
        {/* COLUMNA: DIEZISEISAVOS DE FINAL */}
        <div className="flex flex-col gap-6 flex-1">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-2">Dieciseisavos (R32)</h4>
          {filtrarPorFase("ROUND OF 32").map(p => (
            <TarjetaPartido key={p.id} partido={p} onClick={() => abrirModalResultado(p)} />
          ))}
          {filtrarPorFase("ROUND OF 32").length === 0 && <p className="text-center text-xs text-gray-400 py-4">Por definir</p>}
        </div>

        {/* COLUMNA: OCTAVOS DE FINAL */}
        <div className="flex flex-col gap-24 flex-1 justify-center pt-12">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-2">Octavos de Final</h4>
          {filtrarPorFase("ROUND OF 16").map(p => (
            <TarjetaPartido key={p.id} partido={p} onClick={() => abrirModalResultado(p)} />
          ))}
          {filtrarPorFase("ROUND OF 16").length === 0 && <p className="text-center text-xs text-gray-400 py-4">Por definir</p>}
        </div>

        {/* COLUMNA: CUARTOS DE FINAL */}
        <div className="flex flex-col gap-48 flex-1 justify-center pt-24">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-2">Cuartos de Final</h4>
          {filtrarPorFase("QUARTERFINALS").map(p => (
            <TarjetaPartido key={p.id} partido={p} onClick={() => abrirModalResultado(p)} />
          ))}
          {filtrarPorFase("QUARTERFINALS").length === 0 && <p className="text-center text-xs text-gray-400 py-4">Por definir</p>}
        </div>

        {/* COLUMNA: SEMIFINAL */}
        <div className="flex flex-col justify-center flex-1 pt-40 gap-72">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b pb-2">Semifinales</h4>
          {filtrarPorFase("SEMIFINALS").map(p => (
            <TarjetaPartido key={p.id} partido={p} onClick={() => abrirModalResultado(p)} />
          ))}
          {filtrarPorFase("SEMIFINALS").length === 0 && <p className="text-center text-xs text-gray-400 py-4">Por definir</p>}
        </div>

        {/* COLUMNA: GRAN FINAL */}
        <div className="flex flex-col justify-center flex-1 pt-60">
          <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest text-center border-b border-amber-200 pb-2">Gran Final</h4>
          {filtrarPorFase("FINAL").map(p => (
            <div key={p.id} className="border-2 border-amber-300 rounded-xl shadow-md overflow-hidden bg-gradient-to-b from-amber-50/20 to-white">
              <TarjetaPartido partido={p} onClick={() => abrirModalResultado(p)} />
            </div>
          ))}
          {filtrarPorFase("FINAL").length === 0 && <p className="text-center text-xs text-gray-400 py-4">Por definir</p>}
        </div>

      </div>

      {/* 🪟 MODAL DE RESULTADO EXCLUSIVO PARA FASE ELIMINATORIA */}
      {modalAbierto && partidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-black text-gray-900 uppercase">Registrar Llave: {partidoSeleccionado.fase}</h4>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
            </div>

            {/* MARCADOR REGLAMENTARIO (90 MIN) */}
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tiempo Regular (90' Min)</span>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-gray-700 truncate max-w-[140px]">{partidoSeleccionado.local?.nombre || "POR DEFINIR"}</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={golesLocal} onChange={e => setGolesLocal(e.target.value)} className="w-12 h-9 bg-white border rounded-lg text-center text-sm font-bold focus:outline-sky-500" />
                  <span className="text-gray-400 font-bold">—</span>
                  <input type="number" value={golesVisitante} onChange={e => setGolesVisitante(e.target.value)} className="w-12 h-9 bg-white border rounded-lg text-center text-sm font-bold focus:outline-sky-500" />
                </div>
                <span className="text-xs font-bold text-gray-700 truncate max-w-[140px] text-right">{partidoSeleccionado.visitante?.nombre || "POR DEFINIR"}</span>
              </div>
            </div>

            {/* MARCADOR TIEMPO SUPLEMENTARIO / PRÓRROGA */}
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col gap-2">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider">Goles en Prórroga / Alargue (Opcional)</span>
              <div className="flex items-center justify-center gap-4">
                <input type="number" value={golesProrrogaLocal} onChange={e => setGolesProrrogaLocal(e.target.value)} className="w-12 h-9 bg-white border rounded-lg text-center text-sm font-semibold focus:outline-sky-500" />
                <span className="text-xs font-bold text-gray-400 uppercase">T. Extra</span>
                <input type="number" value={golesProrrogaVisitante} onChange={e => setGolesProrrogaVisitante(e.target.value)} className="w-12 h-9 bg-white border rounded-lg text-center text-sm font-semibold focus:outline-sky-500" />
              </div>
            </div>

            {/* MARCADOR TANDA DE PENALES */}
            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100 flex flex-col gap-2">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Definición por Penales (Solo si persiste empate)</span>
              <div className="flex items-center justify-center gap-4">
                <input type="number" placeholder="G" value={penalesLocal} onChange={e => setPenalesLocal(e.target.value)} className="w-12 h-9 bg-white border border-amber-200 rounded-lg text-center text-sm font-bold focus:outline-amber-500" />
                <span className="text-xs font-black text-amber-700 uppercase tracking-widest px-2">PENALES</span>
                <input type="number" placeholder="G" value={penalesVisitante} onChange={e => setPenalesVisitante(e.target.value)} className="w-12 h-9 bg-white border border-amber-200 rounded-lg text-center text-sm font-bold focus:outline-amber-500" />
              </div>
            </div>

            <button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors mt-2">
              Guardar Llave Eliminatoria
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Subcomponente interno para renderizar cada celda/tarjeta del árbol de forma limpia
function TarjetaPartido({ partido, onClick }) {
  const tienePenales = partido.penales_local !== null && partido.penales_visitante !== null
  const totalLocal = partido.goles_local + (partido.goles_prorroga_local || 0)
  const totalVisitante = partido.goles_visitante + (partido.goles_prorroga_visitante || 0)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all flex flex-col gap-2 relative">
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
        <span>{partido.fecha ? new Date(partido.fecha).toLocaleDateString('es-ES') : "Fecha por definir"}</span>
        <button onClick={onClick} className="w-6 h-6 rounded-md text-sky-600 hover:bg-sky-50 flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-base">edit_note</span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Fila Equipo Local */}
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-gray-800 uppercase truncate max-w-[130px]">
            {partido.local?.nombre || "Por definir"}
          </span>
          <div className="flex items-center gap-1">
            {tienePenales && <span className="text-[10px] text-amber-600 font-black">({partido.penales_local})</span>}
            <span className={`w-6 text-center font-black ${totalLocal >= totalVisitante && (partid.local) ? "text-slate-900" : "text-gray-400"}`}>
              {partido.local ? totalLocal : "—"}
            </span>
          </div>
        </div>

        {/* Fila Equipo Visitante */}
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-gray-800 uppercase truncate max-w-[130px]">
            {partido.visitante?.nombre || "Por definir"}
          </span>
          <div className="flex items-center gap-1">
            {tienePenales && <span className="text-[10px] text-amber-600 font-black">({partido.penales_visitante})</span>}
            <span className={`w-6 text-center font-black ${totalVisitante >= totalLocal && (partid.visitante) ? "text-slate-900" : "text-gray-400"}`}>
              {partido.visitante ? totalVisitante : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}