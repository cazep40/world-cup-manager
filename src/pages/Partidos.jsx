import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

export default function Partidos() {
  // Estados de datos generales
  const [partidos, setPartidos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [jugadores, setJugadores] = useState([]) // Almacenará los jugadores filtrados del partido activo
  const [golesPartidoActual, setGolesPartidoActual] = useState([])

  // Paginación de la tabla de partidos
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados del Formulario de Partidos
  const [fase, setFase] = useState("")
  const [grupoFiltro, setGrupoFiltro] = useState("") 
  const [localId, setLocalId] = useState("")
  const [visitanteId, setVisitanteId] = useState("")
  const [fecha, setFecha] = useState("")
  const [partidoId, setPartidoId] = useState("")
  const [editarPartido, setEditarPartido] = useState(false)

  // Estados del Formulario del Modal de Goles
  const [modalGolesAbierto, setModalGolesAbierto] = useState(false)
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null)
  const [golJugadorId, setGolJugadorId] = useState("")
  const [golEquipoAnotadorId, setGolEquipoAnotadorId] = useState("") 
  const [golMinuto, setGolMinuto] = useState("")
  const [golEsPenal, setGolEsPenal] = useState(false)

  // Estado para notificaciones personalizadas (Toast)
  const [toast, setToast] = useState({ mostrar: false, mensaje: "" })

  const opcionesFases = [
    "FASE DE GRUPOS",
    "DIECISEISAVOS DE FINAL",
    "OCTAVOS DE FINAL",
    "CUARTOS DE FINAL",
    "SEMIFINAL",
    "ELIMINATORIA TERCER LUGAR",
    "FINAL"
  ]

  const opcionesGrupos = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

  useEffect(() => {
    getInitialData()
  }, [])

  async function getInitialData() {
    const [partidosRes, equiposRes] = await Promise.all([
      supabase.from('partidos').select('*').order('fecha', { ascending: false }),
      supabase.from('equipos').select('id, nombre, grupo').order('nombre', { ascending: true })
    ])

    if (partidosRes.error || equiposRes.error) {
      lanzarToast("Error al sincronizar el fixture y los datos del torneo.")
      return
    }

    setPartidos(partidosRes.data || [])
    setEquipos(equiposRes.data || [])
  }

  function lanzarToast(mensaje) {
    setToast({ mostrar: true, mensaje })
  }

  function manejarCierreToast() {
    setToast({ mostrar: false, mensaje: "" })
    if (localId === visitanteId || !partidoId) {
      limpiarFormulario()
    }
  }

  async function getPartidos() {
    const { data, error } = await supabase
      .from('partidos')
      .select('*')
      .order('fecha', { ascending: false })

    if (!error) setPartidos(data || [])
  }

  const equiposFiltrados = fase === "FASE DE GRUPOS" && grupoFiltro
    ? equipos.filter(eq => eq.grupo === grupoFiltro.toUpperCase())
    : equipos

  function validarPartido() {
    const idLocal = parseInt(localId, 10)
    const idVisitante = parseInt(visitanteId, 10)

    if (idLocal === idVisitante) {
      lanzarToast("Restricción: Una selección no puede jugar contra sí misma.")
      return false
    }

    if (fase === "FASE DE GRUPOS") {
      const datosLocal = equipos.find(e => e.id === idLocal)
      const datosVisitante = equipos.find(e => e.id === idVisitante)

      if (datosLocal?.grupo !== datosVisitante?.grupo) {
        lanzarToast(`Inconsistencia: En FASE DE GRUPOS los rivales deben ser del mismo grupo.`)
        return false
      }
    }
    return true
  }

  async function postPartido(e) {
    e.preventDefault()
    if (!localId || !visitanteId || !fase || !fecha) {
      lanzarToast("Por favor, completa todos los datos obligatorios del encuentro.")
      return
    }
    if (!validarPartido()) return

    const { error } = await supabase
      .from('partidos')
      .insert({
        local_id: parseInt(localId, 10),
        visitante_id: parseInt(visitanteId, 10),
        fase: fase,
        fecha: fecha,
        goles_local: 0,
        goles_visitante: 0
      })

    if (!error) {
      limpiarFormulario()
      getPartidos()
    }
  }

  function putPartido(partido) {
    const eqLocal = equipos.find(e => e.id === partido.local_id)
    setFase(partido.fase)
    if (partido.fase === "FASE DE GRUPOS" && eqLocal) {
      setGrupoFiltro(eqLocal.grupo)
    }
    setLocalId(partido.local_id.toString())
    setVisitanteId(partido.visitante_id.toString())
    setFecha(partido.fecha ? partido.fecha.substring(0, 16) : "")
    setPartidoId(partido.id)
    setEditarPartido(true)
  }

  async function updatePartido(e) {
    e.preventDefault()
    if (!localId || !visitanteId || !fase || !fecha) {
      lanzarToast("Por favor, rellena todos los campos requeridos.")
      return
    }
    if (!validarPartido()) return

    const { error } = await supabase
      .from('partidos')
      .update({
        local_id: parseInt(localId, 10),
        visitante_id: parseInt(visitanteId, 10),
        fase: fase,
        fecha: fecha
      })
      .eq('id', partidoId)

    if (!error) {
      limpiarFormulario()
      getPartidos()
    }
  }

  async function deletePartido(id) {
    const { error } = await supabase.from('partidos').delete().eq('id', id)
    if (!error) getPartidos()
  }

  function limpiarFormulario() {
    setFase("")
    setGrupoFiltro("")
    setLocalId("")
    setVisitanteId("")
    setFecha("")
    setPartidoId("")
    setEditarPartido(false)
  }

  /* =========================================================================
     🔥 LÓGICA DEL MODAL DE GOLES MEJORADA (CARGA REAL DE JUGADORES DESDE BD)
     ========================================================================= */
  
  async function abrirGestionGoles(partido) {
    setPartidoSeleccionado(partido)
    setModalGolesAbierto(true)
    setGolJugadorId("")
    setGolEquipoAnotadorId("")
    setGolMinuto("")
    setGolEsPenal(false)
    
    // ✅ Trae directamente los 52 jugadores de ambos equipos desde Supabase sin pérdidas
    const { data: jugadoresRes, error: errorJugadores } = await supabase
      .from('jugadores')
      .select('id, nombre, equipo_id')
      .in('equipo_id', [Number(partido.local_id), Number(partido.visitante_id)])
      .order('nombre', { ascending: true })

    if (!errorJugadores) {
      setJugadores(jugadoresRes || [])
    }

    await cargarGolesEIncidencias(partido.id)
  }

  async function cargarGolesEIncidencias(idPartido) {
    const { data, error } = await supabase
      .from('goles')
      .select('*')
      .eq('partido_id', idPartido)
      .order('minuto', { ascending: true })

    if (!error) {
      setGolesPartidoActual(data || [])
    }
  }

  // ✅ Al venir filtrados directo de la BD, la lista limpia es equivalente al estado entero
  const jugadoresDelPartido = jugadores

  async function agregarGolIncidencia(e) {
    e.preventDefault()
    if (!golJugadorId || !golEquipoAnotadorId || !golMinuto) {
      alert("Por favor, completa los datos de la incidencia del gol.")
      return
    }

    const jugadorSeleccionado = jugadores.find(j => Number(j.id) === Number(golJugadorId))
    if (!jugadorSeleccionado) return

    const esAutogolReal = Number(jugadorSeleccionado.equipo_id) !== Number(golEquipoAnotadorId)

    // ✅ Inserción limpia con las columnas exactas de tu tabla 'goles'
    const { error: errorInsert } = await supabase
      .from('goles')
      .insert({
        partido_id: partidoSeleccionado.id,
        jugador_id: jugadorSeleccionado.id,
        minuto: parseInt(golMinuto, 10),
        es_penal: golEsPenal,
        es_autogol: esAutogolReal
      })

    if (errorInsert) {
      console.error("Error de Supabase:", errorInsert)
      alert("Error al registrar el gol.")
      return
    }

    await recalcularMarcadorAbsoluto(partidoSeleccionado.id)

    setGolJugadorId("")
    setGolEquipoAnotadorId("")
    setGolMinuto("")
    setGolEsPenal(false)
  }

  async function eliminarGolIncidencia(golId) {
    const { error } = await supabase.from('goles').delete().eq('id', golId)
    if (error) {
      alert("No se pudo remover el gol.")
      return
    }
    await recalcularMarcadorAbsoluto(partidoSeleccionado.id)
  }

  async function recalcularMarcadorAbsoluto(idPartido) {
    const { data: todosLosGoles, error } = await supabase
      .from('goles')
      .select('*')
      .eq('partido_id', idPartido)

    if (error) return

    const part = partidos.find(p => p.id === idPartido)
    if (!part) return

    let nuevoGolesLocal = 0
    let nuevoGolesVisitante = 0

    todosLosGoles.forEach(g => {
      const jug = jugadores.find(j => Number(j.id) === Number(g.jugador_id))
      if (!jug) return

      const idJugadorEquipo = Number(jug.equipo_id)
      const idPartidoLocal = Number(part.local_id)
      const idPartidoVisitante = Number(part.visitante_id)

      if (!g.es_autogol) {
        if (idJugadorEquipo === idPartidoLocal) nuevoGolesLocal++
        if (idJugadorEquipo === idPartidoVisitante) nuevoGolesVisitante++
      } else {
        if (idJugadorEquipo === idPartidoLocal) nuevoGolesVisitante++
        if (idJugadorEquipo === idPartidoVisitante) nuevoGolesLocal++
      }
    })

    const { error: errorUpdate } = await supabase
      .from('partidos')
      .update({ goles_local: nuevoGolesLocal, goles_visitante: nuevoGolesVisitante })
      .eq('id', idPartido)

    if (!errorUpdate) {
      getPartidos()
      setGolesPartidoActual(todosLosGoles.sort((a,b) => a.minuto - b.minuto))
      setPartidoSeleccionado(prev => ({
        ...prev,
        goles_local: nuevoGolesLocal,
        goles_visitante: nuevoGolesVisitante
      }))
    }
  }

  function obtenerNombreEquipo(id) {
    const eq = equipos.find(e => Number(e.id) === Number(id))
    return eq ? eq.nombre : "—"
  }

  function obtenerNombreJugador(id) {
    const jug = jugadores.find(j => Number(j.id) === Number(id))
    return jug ? jug.nombre : "Jugador Desconocido"
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPartidos = partidos.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(partidos.length / itemsPerPage)

  return (
    <div className="flex flex-col gap-8 relative animate-fade-in duration-300">
      
      {/* Toast */}
      {toast.mostrar && (
        <div className="fixed top-20 right-6 z-50 bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-xl flex items-center gap-4 max-w-xl border border-gray-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Aviso del Sistema</span>
            <p className="text-sm font-semibold text-red-700">{toast.mensaje}</p>
          </div>
          <button type="button" onClick={manejarCierreToast} className="ml-auto text-red-500"><span className="material-symbols-outlined">close</span></button>
        </div>
      )}

      {/* MODAL DE GOLES */}
      {modalGolesAbierto && partidoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            <div className="bg-sky-950 text-white p-6 relative text-center">
              <button onClick={() => setModalGolesAbierto(false)} className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
              <span className="text-[10px] bg-sky-800 text-sky-200 border border-sky-700 font-black px-3 py-0.5 rounded-full uppercase">
                {partidoSeleccionado.fase}
              </span>
              <div className="flex justify-center items-center gap-4 mt-3">
                <span className="text-sm font-black uppercase flex-1 text-right truncate">{obtenerNombreEquipo(partidoSeleccionado.local_id)}</span>
                <span className="text-3xl font-black bg-sky-900 px-4 py-1.5 rounded-xl border border-sky-800">
                  {partidoSeleccionado.goles_local} - {partidoSeleccionado.goles_visitante}
                </span>
                <span className="text-sm font-black uppercase flex-1 text-left truncate">{obtenerNombreEquipo(partidoSeleccionado.visitante_id)}</span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto">
              
              <form onSubmit={agregarGolIncidencia} className="md:col-span-5 flex flex-col gap-3.5 bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">Registrar Gol</h4>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Anotador</label>
                  <select value={golJugadorId} onChange={e => setGolJugadorId(e.target.value)} className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 focus:outline-sky-500">
                    <option value="">— SELECCIONE JUGADOR —</option>
                    {jugadoresDelPartido.map(j => (
                      <option key={j.id} value={j.id}>{j.nombre} ({obtenerNombreEquipo(j.equipo_id)})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Suma al marcador de:</label>
                  <select value={golEquipoAnotadorId} onChange={e => setGolEquipoAnotadorId(e.target.value)} className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs font-bold text-gray-900 focus:outline-sky-500">
                    <option value="">— ¿PARA QUÉ EQUIPO? —</option>
                    <option value={partidoSeleccionado.local_id}>{obtenerNombreEquipo(partidoSeleccionado.local_id)} (LOCAL)</option>
                    <option value={partidoSeleccionado.visitante_id}>{obtenerNombreEquipo(partidoSeleccionado.visitante_id)} (VISITANTE)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Minuto</label>
                    <input type="number" min="1" max="130" value={golMinuto} onChange={e => setGolMinuto(e.target.value)} className="w-full border rounded-lg px-2 py-1 text-center text-xs font-bold focus:outline-sky-500" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-4">
                    <input type="checkbox" id="cb-penal" checked={golEsPenal} onChange={e => setGolEsPenal(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="cb-penal" className="text-[10px] font-black uppercase cursor-pointer">¿Penal?</label>
                  </div>
                </div>

                <button type="submit" className="w-full bg-sky-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-sky-700 cursor-pointer">Registrar Gol</button>
              </form>

              <div className="md:col-span-7 flex flex-col gap-3">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b pb-2">Cronología</h4>
                {golesPartidoActual.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">Marcador en cero.</div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
                    {golesPartidoActual.map(g => (
                      <div key={g.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-sky-100 text-sky-800 rounded-lg px-2 py-0.5">{g.minuto}'</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 uppercase">{obtenerNombreJugador(g.jugador_id)}</span>
                            <div className="flex gap-1 items-center mt-0.5">
                              {g.es_penal && <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 rounded">Penal</span>}
                              {g.es_autogol && <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-1.5 rounded">Autogol</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => { if(window.confirm("¿Borrar gol?")) eliminarGolIncidencia(g.id) }} className="text-gray-400 hover:text-red-500 cursor-pointer">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UI Principal */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Fixture de Partidos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2">⚽ {editarPartido ? "Modificar Encuentro" : "Registrar Encuentro"}</h3>
          <form onSubmit={editarPartido ? updatePartido : postPartido} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Etapa / Fase</label>
              <select value={fase} onChange={e => { setFase(e.target.value); setGrupoFiltro(""); setLocalId(""); setVisitanteId(""); }} className="w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm font-bold uppercase">
                <option value="">— SELECCIONE FASE —</option>
                {opcionesFases.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>

            {fase === "FASE DE GRUPOS" && (
              <div className="flex flex-col gap-1.5 bg-sky-50/50 p-3 rounded-xl border border-sky-100 border-dashed">
                <label className="text-xs font-black text-sky-900 uppercase">Filtrar por Grupo</label>
                <select value={grupoFiltro} onChange={e => { setGrupoFiltro(e.target.value); setLocalId(""); setVisitanteId(""); }} className="w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold">
                  <option value="">— SELECCIONE GRUPO —</option>
                  {opcionesGrupos.map(g => <option key={g} value={g}>GRUPO {g}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Fecha y Hora</label>
              <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-3 py-2.5 text-sm text-gray-500 font-semibold focus:bg-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select value={localId} onChange={e => setLocalId(e.target.value)} className="bg-gray-50 border rounded-xl p-2 text-xs font-bold">
                <option value="">LOCAL</option>
                {equiposFiltrados.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
              <select value={visitanteId} onChange={e => setVisitanteId(e.target.value)} className="bg-gray-50 border rounded-xl p-2 text-xs font-bold">
                <option value="">VISITANTE</option>
                {equiposFiltrados.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-sky-600 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-sky-700 cursor-pointer">{editarPartido ? "Guardar" : "Insertar"}</button>
              {editarPartido && <button type="button" onClick={limpiarFormulario} className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-200">Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-sky-100 text-sky-900 text-xs font-black uppercase tracking-wider border-b border-sky-200/60">
              <div className="col-span-3">Fecha</div>
              <div className="col-span-5 text-center">Partido / Marcador</div>
              <div className="col-span-2 text-center">Fase</div>
              <div className="col-span-2 text-right">Opciones</div>
            </div>

            {currentPartidos.map(partido => (
              <div key={partido.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                <div className="col-span-3 text-xs text-gray-500">
                  {partido.fecha ? new Date(partido.fecha).toLocaleDateString('es-ES', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : "—"}
                </div>
                <div className="col-span-5 flex justify-center items-center gap-3">
                  <span className="text-sm font-bold text-gray-900 flex-1 text-right uppercase truncate">{obtenerNombreEquipo(partido.local_id)}</span>
                  <span className="text-sm text-sky-700 font-black bg-sky-100 px-3 py-1 rounded-lg min-w-[65px] text-center">{partido.goles_local} - {partido.goles_visitante}</span>
                  <span className="text-sm font-bold text-gray-900 flex-1 text-left uppercase truncate">{obtenerNombreEquipo(partido.visitante_id)}</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-extrabold px-2 py-0.5 rounded-full uppercase">{partido.fase.replace(" DE FINAL", "")}</span>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <button onClick={() => abrirGestionGoles(partido)} className="w-8 h-8 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center justify-center cursor-pointer transition-colors"><span className="material-symbols-outlined text-lg">sports_soccer</span></button>
                  <button onClick={() => putPartido(partido)} className="w-8 h-8 rounded-lg text-sky-600 hover:bg-sky-50 flex items-center justify-center cursor-pointer transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                  <button onClick={() => { if(window.confirm("¿Eliminar partido? Se borrarán sus incidencias de goles automáticamente.")) deletePartido(partido.id) }} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500">Página <b className="text-gray-800">{currentPage}</b> de {totalPages}</span>
              <div className="flex gap-1.5">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-white text-gray-600 bg-white shadow-sm cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm font-bold">chevron_left</span></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-white text-gray-600 bg-white shadow-sm cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm font-bold">chevron_right</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}