import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalEquipos: 0,
    totalJugadores: 0,
    totalPartidos: 0,
    totalGoles: 0,
    promedioGoles: 0
  })
  const [ultimosPartidos, setUltimosPartidos] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)

        // 1. Consultas simultáneas para las métricas con count 'exact'
        const [equiposRes, jugadoresRes, partidosRes, golesRes] = await Promise.all([
          supabase.from('equipos').select('*', { count: 'exact', head: true }),
          supabase.from('jugadores').select('*', { count: 'exact', head: true }),
          supabase.from('partidos').select('*', { count: 'exact', head: true }),
          supabase.from('goles').select('*', { count: 'exact', head: true })
        ])

        const totalEquipos = equiposRes.count || 0
        const totalJugadores = jugadoresRes.count || 0
        const totalPartidos = partidosRes.count || 0
        const totalGoles = golesRes.count || 0
        const promedioGoles = totalPartidos > 0 ? (totalGoles / totalPartidos).toFixed(2) : '0.00'

        setMetrics({
          totalEquipos,
          totalJugadores,
          totalPartidos,
          totalGoles,
          promedioGoles
        })

        // 2. Obtener los últimos 5 partidos con los nombres de los equipos mediante sus llaves foráneas
        const { data: partidosData, error: partidosError } = await supabase
          .from('partidos')
          .select(`
            id,
            fecha,
            fase,
            goles_local,
            goles_visitante,
            local:equipos!partidos_local_id_fkey(nombre),
            visitante:equipos!partidos_visitante_id_fkey(nombre)
          `)
          .order('fecha', { ascending: false })
          .limit(5)

        if (partidosError) throw partidosError
        setUltimosPartidos(partidosData || [])

      } catch (error) {
        // ✅ CORREGIDO: Un solo bloque catch unificado que lee el compilador sin problemas
        console.error('Error cargando datos del dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const cards = [
    { icon: 'shield', label: 'Total Equipos', value: metrics.totalEquipos },
    { icon: 'person_search', label: 'Total Jugadores', value: metrics.totalJugadores },
    { icon: 'sports_soccer', label: 'Total Partidos', value: metrics.totalPartidos },
    { icon: 'emoji_events', label: 'Total Goles', value: metrics.totalGoles },
    { icon: 'trending_up', label: 'Prom. Goles/Partido', value: metrics.promedioGoles },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-300">
      
      {/* Cabecera del Dashboard */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h2>
        <p className="text-sm font-medium text-gray-500 mt-1">
          Resumen del torneo en tiempo real
        </p>
      </div>

      {/* Tarjetas de Métricas Rediseñadas (Proporciones elegantes) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[135px]"
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider max-w-[80%]">
                {card.label}
              </p>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-base font-bold">{card.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-3">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      {/* Tabla de Últimos Partidos Estilizada */}
      <section className="mt-2">
        <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-400 text-xl">history</span>
          Últimos Partidos
        </h3>
        
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Encabezados con tipografía fina */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/70 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <div className="col-span-2">Fecha</div>
            <div className="col-span-6 text-center">Partido</div>
            <div className="col-span-2 text-center">Fase</div>
            <div className="col-span-2 text-right">Resultado</div>
          </div>
          
          {ultimosPartidos.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs font-medium">
              No hay partidos registrados en este momento.
            </div>
          ) : (
            ultimosPartidos.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors"
              >
                {/* Columna Fecha */}
                <div className="col-span-2 text-xs font-semibold text-gray-500">
                  {p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '—'}
                </div>
                
                {/* Columna Central del Partido */}
                <div className="col-span-6 flex justify-center items-center gap-4">
                  <div className="flex items-center justify-end gap-2.5 flex-1 text-right">
                    <span className="text-xs font-bold text-gray-900 uppercase truncate">
                      {p.local?.nombre || 'S/N'}
                    </span>
                  </div>

                  <span className="text-xs font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-lg min-w-[62px] text-center border border-sky-100/60 shadow-2xs">
                    {p.goles_local} - {p.goles_visitante}
                  </span>

                  <div className="flex items-center justify-start gap-2.5 flex-1 text-left">
                    <span className="text-xs font-bold text-gray-900 uppercase truncate">
                      {p.visitante?.nombre || 'S/N'}
                    </span>
                  </div>
                </div>

                {/* Columna Fase */}
                <div className="col-span-2 text-center">
                  <span className="text-[9px] bg-gray-100 text-gray-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    {p.fase.replace("DE FINAL", "")}
                  </span>
                </div>

                {/* Columna Estado/Resultado */}
                <div className="col-span-2 text-right">
                  <span className="text-[10px] text-gray-400 font-extrabold tracking-widest bg-gray-50 border px-2 py-0.5 rounded">
                    FT
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}