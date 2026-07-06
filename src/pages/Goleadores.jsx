import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

export default function Goleadores() {
  const [goleadores, setGoleadores] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    procesarTablaGoleadores()
  }, [])

  async function procesarTablaGoleadores() {
    setLoading(true)
    
    // 1. Primero traemos los goles y partidos disputados
    const [golesRes, partidosRes, equiposRes] = await Promise.all([
      supabase.from("goles").select("*"),
      supabase.from("partidos").select("id, local_id, visitante_id"),
      supabase.from("equipos").select("id, nombre")
    ])

    if (golesRes.error || partidosRes.error || equiposRes.error) {
      console.error("Error al recopilar datos estadísticos.")
      setLoading(false)
      return
    }

    const listaGoles = golesRes.data || []
    const listaPartidos = partidosRes.data || []
    setEquipos(equiposRes.data || [])

    // 2. Extraemos las IDs únicas de todos los jugadores que han metido goles
    const idsAnotadores = [...new Set(listaGoles.map(g => Number(g.jugador_id)))]

    if (idsAnotadores.length === 0) {
      setGoleadores([])
      setLoading(false)
      return
    }

    // 3. 🎯 Traemos de Supabase SOLO a los jugadores que están en esa lista de anotadores
    // Esto rompe el límite de 1000 registros porque la consulta va directo al grano
    const { data: listaJugadores, error: jugadoresError } = await supabase
      .from("jugadores")
      .select("id, nombre, equipo_id, foto_url")
      .in("id", idsAnotadores)

    if (jugadoresError) {
      console.error("Error al traer los jugadores anotadores:", jugadoresError)
      setLoading(false)
      return
    }

    // 4. Mapeamos y calculamos los goles válidos (evitando autogoles)
    const conteoGoles = listaJugadores.map(jugador => {
      const golesValidos = listaGoles.filter(gol => {
        if (Number(gol.jugador_id) !== Number(jugador.id)) return false

        const partido = listaPartidos.find(p => Number(p.id) === Number(gol.partido_id))
        if (!partido) return false

        const idJugadorEquipo = Number(jugador.equipo_id)
        const idPartidoLocal = Number(partido.local_id)
        const idPartidoVisitante = Number(partido.visitante_id)

        return idJugadorEquipo === idPartidoLocal || idJugadorEquipo === idPartidoVisitante
      })

      return {
        ...jugador,
        totalGoles: golesValidos.length,
        golesPenal: golesValidos.filter(g => g.es_penal).length
      }
    })
    // Mostramos solo los que tengan goles reales y ordenamos de mayor a menor
    .filter(j => j.totalGoles > 0)
    .sort((a, b) => b.totalGoles - a.totalGoles || a.nombre.localeCompare(b.nombre))

    setGoleadores(conteoGoles)
    setLoading(false)
  }

  // ✅ CORREGIDO: Casteo numérico para evitar el "SIN EQUIPO"
  function obtenerNombreEquipo(id) {
    const eq = equipos.find(e => Number(e.id) === Number(id))
    return eq ? eq.nombre : "SIN EQUIPO"
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-300">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tabla de Goleadores</h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Clasificación oficial de los máximos anotadores y la disputa por la Bota de Oro.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-sky-100 text-sky-900 text-xs font-black uppercase tracking-wider border-b border-sky-200/60">
          <div className="col-span-1 text-center">Puesto</div>
          <div className="col-span-5">Jugador</div>
          <div className="col-span-3">Selección</div>
          <div className="col-span-3 text-center">Goles (Penal)</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400 font-medium">
            Calculando estadísticas en tiempo real...
          </div>
        ) : goleadores.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400 font-medium">
            El torneo está por comenzar. Aún no se registran anotaciones en el fixture.
          </div>
        ) : (
          goleadores.map((jugador, index) => (
            <div
              key={jugador.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 text-sm font-bold text-gray-700 hover:bg-gray-50/70 transition-colors"
            >
              {/* Puesto */}
              <div className="col-span-1 text-center">
                <span className={`inline-block w-6 h-6 leading-6 rounded-full text-xs font-black ${
                  index === 0 ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300" :
                  index === 1 ? "bg-slate-100 text-slate-800" :
                  index === 2 ? "bg-orange-100 text-orange-800" : "text-gray-500 bg-gray-50"
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* Info Jugador */}
              <div className="col-span-5 flex items-center gap-3">
                <img
                  src={jugador.foto_url || "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"}
                  alt="Foto"
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-xs bg-gray-50"
                />
                <span className="font-black text-gray-900 uppercase tracking-tight">{jugador.nombre}</span>
              </div>

              {/* Selección */}
              <div className="col-span-3">
                <span className="text-xs font-black text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg uppercase">
                  {obtenerNombreEquipo(jugador.equipo_id)}
                </span>
              </div>

              {/* Conteo de Goles */}
              <div className="col-span-3 text-center flex justify-center items-center gap-1.5">
                <span className="text-lg font-black text-gray-900">{jugador.totalGoles}</span>
                {jugador.golesPenal > 0 && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-1.5 py-0.5 rounded border border-amber-100">
                    ({jugador.golesPenal} P)
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}