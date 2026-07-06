import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

export default function Posiciones() {
  const [equipos, setEquipos] = useState([])
  const [partidos, setPartidos] = useState([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("A")

  const opcionesGrupos = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [equiposRes, partidosRes] = await Promise.all([
      supabase.from("equipos").select("*"),
      supabase.from("partidos").select("*").eq("fase", "FASE DE GRUPOS")
    ])

    if (!equiposRes.error && !partidosRes.error) {
      setEquipos(equiposRes.data || [])
      setPartidos(partidosRes.data || [])
    }
  }

  // 🔥 PROCESAMIENTO MATEMÁTICO DE LA TABLA EN TIEMPO REAL
  const tablaProcesada = equipos
    .filter(eq => eq.grupo === grupoSeleccionado)
    .map(equipo => {
      let pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, gc = 0, puntos = 0

      // Filtrar partidos donde jugó este equipo
      partidos.forEach(p => {
        const esLocal = p.local_id === equipo.id
        const esVisitante = p.visitante_id === equipo.id

        if (esLocal || esVisitante) {
          pj++
          const golesFavor = esLocal ? p.goles_local : p.goles_visitante
          const golesContra = esLocal ? p.goles_visitante : p.goles_local

          gf += golesFavor
          gc += golesContra

          if (golesFavor > golesContra) {
            pg++
            puntos += 3
          } else if (golesFavor === golesContra) {
            pe++
            puntos += 1
          } else {
            pp++
          }
        }
      })

      return {
        ...equipo,
        pj, pg, pe, pp, gf, gc,
        dg: gf - gc,
        puntos
      }
    })
    // Criterios oficiales de ordenamiento: Puntos -> Diferencia de Goles -> Goles a Favor -> Nombre
    .sort((a, b) => b.puntos - a.puntos || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre))

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-300">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tabla de Posiciones</h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Resultados estadísticos y clasificación interna de la Fase de Grupos.
        </p>
      </div>

      {/* Selector de Grupos con Estética de Pestañas */}
      <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200/60 max-w-max">
        {opcionesGrupos.map(g => (
          <button
            key={g}
            onClick={() => setGrupoSeleccionado(g)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              grupoSeleccionado === g
                ? "bg-sky-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            GRUPO {g}
          </button>
        ))}
      </div>

      {/* Tabla Estilizada */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-3.5 bg-sky-100 text-sky-900 text-xs font-black uppercase tracking-wider border-b border-sky-200/60 text-center">
          <div className="col-span-1 text-left">#</div>
          <div className="col-span-4 text-left">Selección</div>
          <div className="col-span-1">PJ</div>
          <div className="col-span-1">PG</div>
          <div className="col-span-1">PE</div>
          <div className="col-span-1">PP</div>
          <div className="col-span-1">GF</div>
          <div className="col-span-1">GC</div>
          <div className="col-span-1">DG</div>
          <div className="col-span-1 text-sky-700">PTS</div>
        </div>

        {tablaProcesada.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 font-medium">
            No hay equipos registrados en el Grupo {grupoSeleccionado}.
          </div>
        ) : (
          tablaProcesada.map((eq, index) => (
            <div
              key={eq.id}
              className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-gray-50 last:border-0 text-center text-sm font-bold text-gray-600 transition-colors ${
                index < 2 ? "bg-emerald-50/20 hover:bg-emerald-50/40" : "hover:bg-gray-50/70"
              }`}
            >
              {/* Indicador visual de zona de clasificación (Top 2) */}
              <div className="col-span-1 text-left flex items-center gap-1">
                <span className={`w-5 h-5 flex items-center justify-center rounded-md text-xs font-black ${
                  index < 2 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
                }`}>
                  {index + 1}
                </span>
              </div>
              <div className="col-span-4 text-left font-black text-gray-900 uppercase truncate">
                {eq.nombre}
              </div>
              <div className="col-span-1 font-semibold">{eq.pj}</div>
              <div className="col-span-1 text-emerald-600">{eq.pg}</div>
              <div className="col-span-1">{eq.pe}</div>
              <div className="col-span-1 text-red-500">{eq.pp}</div>
              <div className="col-span-1 font-medium">{eq.gf}</div>
              <div className="col-span-1 font-medium">{eq.gc}</div>
              <div className={`col-span-1 font-extrabold ${eq.dg > 0 ? "text-emerald-600" : eq.dg < 0 ? "text-red-500" : "text-gray-400"}`}>
                {eq.dg > 0 ? `+${eq.dg}` : eq.dg}
              </div>
              <div className="col-span-1 font-black text-sky-700 text-base">{eq.puntos}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}