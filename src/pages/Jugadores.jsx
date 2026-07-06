import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

export default function Jugadores() {
  // Estados para listas y paginación
  const [jugadores, setJugadores] = useState([])
  const [equipos, setEquipos] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ESTADOS PARA LOS FILTROS SUPERIORES
  const [busquedaNombre, setBusquedaNombre] = useState("")
  const [filtroEquipoId, setFiltroEquipoId] = useState("")
  const [filtroPosicion, setFiltroPosicion] = useState("")

  // Estados del Formulario
  const [nombre, setNombre] = useState("")
  const [posicion, setPosicion] = useState("")
  const [dorsal, setDorsal] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [equipoId, setEquipoId] = useState("")
  const [jugadorId, setJugadorId] = useState("")
  const [editarJugador, setEditarJugador] = useState(false)
  
  // Estado para el archivo físico de la foto local
  const [archivoFoto, setArchivoFoto] = useState(null)

  // Estado para la notificación personalizada
  const [toast, setToast] = useState({ mostrar: false, mensaje: "" })

  // Estado para controlar el Modal de Vista Ampliada
  const [modalJugador, setModalJugador] = useState({ abierto: false, jugador: null })

  // Estandarizado a CENTROCAMPISTA como figura en tu Supabase
  const opcionesPosiciones = ["PORTERO", "DEFENSA", "CENTROCAMPISTA", "DELANTERO"]

  useEffect(() => {
    getInitialData()
  }, [])

  // 🔥 SINCRO TOTAL: Cada vez que el usuario escriba un nombre o cambie de país, consultamos directo a Supabase
  useEffect(() => {
    getJugadores()
  }, [busquedaNombre, filtroEquipoId])

  async function getInitialData() {
    const { data: equiposRes, error: errorEquipos } = await supabase
      .from('equipos')
      .select('id, nombre')
      .order('nombre', { ascending: true })

    if (errorEquipos) {
      lanzarToast("Error al sincronizar las selecciones con Supabase.")
      return
    }
    setEquipos(equiposRes || [])
    
    // Carga inicial de jugadores
    await getJugadores()
  }

  function lanzarToast(mensaje) {
    setToast({ mostrar: true, mensaje })
  }

  function manejarCierreToast() {
    setToast({ mostrar: false, mensaje: "" })
    limpiarFormulario()
  }

  // 🔥 CONSULTA REMOTA INTELIGENTE: Busca directamente en los más de 1200 registros de la BD
  async function getJugadores() {
    let consulta = supabase.from('jugadores').select('*')

    // 1. Filtro por Selección / País directo en la BD
    if (filtroEquipoId !== "") {
      consulta = consulta.eq('equipo_id', Number(filtroEquipoId))
    }

    // 2. Filtro por Nombre o Apellido directo en la BD usando ILIKE (ignora mayúsculas/minúsculas)
    if (busquedaNombre.trim() !== "") {
      consulta = consulta.ilike('nombre', `%${busquedaNombre.trim()}%`)
    }

    // Si no hay filtros activos, ponemos un límite preventivo alto para la vista general
    if (filtroEquipoId === "" && busquedaNombre.trim() === "") {
      consulta = consulta.limit(1500)
    }

    const { data, error } = await consulta.order('nombre', { ascending: true })

    if (error) {
      lanzarToast("Error al refrescar la lista de jugadores.")
      return
    }
    setJugadores(data || [])
  }

  async function subirFotoALStorage(file) {
    try {
      const extension = file.name.split('.').pop()
      const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`
      
      const { data, error } = await supabase.storage
        .from('fotos-jugadores')
        .upload(nombreArchivo, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('fotos-jugadores')
        .getPublicUrl(nombreArchivo)

      return urlData.publicUrl
    } catch (err) {
      console.error("Error crítico de almacenamiento:", err)
      return null
    }
  }

  async function deleteJugador(id) {
    const { data: goles, error: errorGoles } = await supabase
      .from('goles')
      .select('id')
      .eq('jugador_id', id)
      .limit(1)

    if (errorGoles) {
      lanzarToast("Error al validar las restricciones del jugador.")
      return
    }

    if (goles && goles.length > 0) {
      lanzarToast("No se puede eliminar al jugador porque tiene goles registrados en el historial del torneo.")
      return
    }

    const { error } = await supabase.from('jugadores').delete().eq('id', id)

    if (!error) getJugadores()
  }

  async function postJugador(e) {
    e.preventDefault()
    const nombreFormateado = text => text.trim().toUpperCase()

    if (!nombre || !posicion || !dorsal || !fechaNacimiento || !equipoId) {
      lanzarToast("Por favor, completa todos los campos del formulario.")
      return
    }

    let urlDeFoto = null
    if (archivoFoto) {
      urlDeFoto = await subirFotoALStorage(archivoFoto)
      if (!urlDeFoto) return
    }

    const { error } = await supabase
      .from('jugadores')
      .insert({
        nombre: nombreFormateado(nombre),
        posicion: posicion.trim().toUpperCase(),
        dorsal: parseInt(dorsal, 10),
        fecha_nacimiento: fechaNacimiento,
        equipo_id: parseInt(equipoId, 10),
        foto_url: urlDeFoto,
        activo: true
      })

    if (!error) {
      limpiarFormulario()
      getJugadores()
    }
  }

  function putJugador(jugador) {
    setNombre(jugador.nombre.toUpperCase())
    setPosicion(jugador.posicion.toUpperCase())
    setDorsal(jugador.dorsal.toString())
    setFechaNacimiento(jugador.fecha_nacimiento || "")
    setEquipoId(jugador.equipo_id?.toString() || "")
    setJugadorId(jugador.id)
    setEditarJugador(true)
    setArchivoFoto(null)
  }

  async function updateJugador(e) {
    e.preventDefault()
    const nombreFormateado = nombre.trim().toUpperCase()

    if (!nombreFormateado || !posicion || !dorsal || !fechaNacimiento || !equipoId) {
      lanzarToast("Por favor, completa todos los campos del formulario.")
      return
    }

    let camposAActualizar = {
      nombre: nombreFormateado,
      posicion: posicion.trim().toUpperCase(),
      dorsal: parseInt(dorsal, 10),
      fecha_nacimiento: fechaNacimiento,
      equipo_id: parseInt(equipoId, 10)
    }

    if (archivoFoto) {
      const nuevaUrl = await subirFotoALStorage(archivoFoto)
      if (nuevaUrl) camposAActualizar.foto_url = nuevaUrl
    }

    const { error } = await supabase
      .from('jugadores')
      .update(camposAActualizar)
      .eq('id', jugadorId)

    if (!error) {
      limpiarFormulario()
      getJugadores()
    }
  }

  function limpiarFormulario() {
    setNombre("")
    setPosicion("")
    setDorsal("")
    setFechaNacimiento("")
    setEquipoId("")
    setJugadorId("")
    setEditarJugador(false)
    setArchivoFoto(null)
    const inputFile = document.getElementById("input-foto-file")
    if (inputFile) inputFile.value = ""
  }

  function obtenerNombreEquipo(id) {
    const eq = equipos.find(e => Number(e.id) === Number(id))
    return eq ? eq.nombre : "SIN EQUIPO"
  }

  /* =========================================================================
     🎯 FILTRADO AUXILIAR EN MEMORIA (SOLO PARA LA POSICIÓN)
     ========================================================================= */
  const jugadoresFiltrados = jugadores.filter(jugador => {
    return filtroPosicion === "" || jugador.posicion.trim().toUpperCase() === filtroPosicion.toUpperCase()
  })

  // Paginación estricta de 10 en 10 siempre activa
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  
  const currentJugadores = jugadoresFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(jugadoresFiltrados.length / itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [busquedaNombre, filtroEquipoId, filtroPosicion])

  return (
    <div className="flex flex-col gap-8 relative animate-fade-in duration-300">
      
      {/* Toast */}
      {toast.mostrar && (
        <div className="fixed top-20 right-6 z-50 bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-xl flex items-center gap-4 max-w-md border border-gray-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Aviso del Sistema</span>
            <p className="text-sm font-semibold text-red-700">{toast.mensaje}</p>
          </div>
          <button type="button" onClick={manejarCierreToast} className="ml-auto text-red-500"><span className="material-symbols-outlined text-base">close</span></button>
        </div>
      )}

      {/* MODAL JUGADOR */}
      {modalJugador.abierto && modalJugador.jugador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="bg-sky-100 p-6 flex justify-center relative">
              <button onClick={() => setModalJugador({ abierto: false, jugador: null })} className="absolute top-4 right-4 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-white cursor-pointer"><span className="material-symbols-outlined text-lg font-bold">close</span></button>
              <img src={modalJugador.jugador.foto_url || "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} alt="Foto" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white" />
            </div>
            <div className="p-6 flex flex-col gap-4 text-center">
              <div>
                <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{modalJugador.jugador.nombre}</h4>
                <span className="text-xs font-black text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full inline-block mt-2 uppercase">{obtenerNombreEquipo(modalJugador.jugador.equipo_id)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-b border-gray-50 py-3 text-left">
                <div className="flex flex-col"><span className="text-[10px] font-bold text-gray-400 uppercase">Posición</span><span className="text-sm font-bold text-gray-700 uppercase">{modalJugador.jugador.posicion}</span></div>
                <div className="flex flex-col text-right"><span className="text-[10px] font-bold text-gray-400 uppercase">Dorsal</span><span className="text-sm font-extrabold text-gray-900">#{modalJugador.jugador.dorsal}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera Superior Con Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Jugadores</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Administra la plantilla de futbolistas inscritos en las distintas selecciones.</p>
        </div>

        {/* BARRA DE FILTROS SUPERIOR REMOTA */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 shadow-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre/apellido..."
              value={busquedaNombre}
              onChange={e => setBusquedaNombre(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-sky-500 min-w-[190px]"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-gray-400 text-sm">search</span>
          </div>

          <select
            value={filtroEquipoId}
            onChange={e => setFiltroEquipoId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-sky-500 max-w-[160px] cursor-pointer"
          >
            <option value="">TODAS LAS SELECCIONES</option>
            {equipos.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.nombre}</option>
            ))}
          </select>

          <select
            value={filtroPosicion}
            onChange={e => setFiltroPosicion(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-sky-500 cursor-pointer"
          >
            <option value="">TODAS LAS POSICIONES</option>
            {opcionesPosiciones.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {(busquedaNombre || filtroEquipoId || filtroPosicion) && (
            <button
              onClick={() => { setBusquedaNombre(""); setFiltroEquipoId(""); setFiltroPosicion(""); }}
              className="p-1 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors cursor-pointer flex items-center"
              title="Limpiar filtros"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Formulario */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2">⚽ {editarJugador ? "Modificar Jugador" : "Nuevo Jugador"}</h3>
          <form onSubmit={editarJugador ? updateJugador : postJugador} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Selección / Equipo</label>
              <select value={equipoId} onChange={e => setEquipoId(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-sky-500 cursor-pointer">
                <option value="">— SELECCIONE UN EQUIPO —</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Nombre Completo</label>
              <input type="text" placeholder="EJ. LIONEL MESSI" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())} className="w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm font-medium uppercase focus:outline-sky-500" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Posición</label>
              <select value={posicion} onChange={e => setPosicion(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-sky-500 cursor-pointer">
                <option value="">— SELECCIONE POSICIÓN —</option>
                {opcionesPosiciones.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Número de Dorsal</label>
              <input type="number" placeholder="Ej. 10" value={dorsal} onChange={e => setDorsal(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm focus:outline-sky-500" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Fecha de Nacimiento</label>
              <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className="w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm text-gray-500 font-semibold focus:outline-sky-500" />
            </div>

            <div className="flex flex-col gap-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label className="text-xs font-bold text-gray-600 uppercase">Fotografía (Opcional)</label>
              <input id="input-foto-file" type="file" accept="image/*" onChange={e => setArchivoFoto(e.target.files[0])} className="text-xs text-gray-500" />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-sky-600 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-sky-700 cursor-pointer">{editarJugador ? "Guardar" : "Inscribir"}</button>
              {editarJugador && <button type="button" onClick={limpiarFormulario} className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-200">Cancelar</button>}
            </div>
          </form>
        </div>

        {/* Grid Tabla */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-sky-100 text-sky-900 text-xs font-black uppercase border-b border-sky-200/60">
              <div className="col-span-4">Nombre</div>
              <div className="col-span-2">Selección</div>
              <div className="col-span-2 text-center">Posición</div>
              <div className="col-span-2 text-center">Número</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            {currentJugadores.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm font-medium">No hay futbolistas que coincidan con los criterios de búsqueda.</div>
            ) : (
              currentJugadores.map(jugador => (
                <div key={jugador.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <img src={jugador.foto_url || "https://st3.depositphotos.com/15648834/17930/v/600/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg"} alt="Avatar" onClick={() => setModalJugador({ abierto: true, jugador: jugador })} className="w-8 h-8 rounded-full object-cover border cursor-pointer hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-gray-900 uppercase truncate">{jugador.nombre}</span>
                  </div>
                  <div className="col-span-2 text-xs font-black text-sky-700 bg-sky-50/50 border border-sky-100 px-2 py-1 rounded-lg uppercase truncate">{obtenerNombreEquipo(jugador.equipo_id)}</div>
                  <div className="col-span-2 text-center text-xs font-bold text-gray-500 uppercase">{jugador.posicion}</div>
                  <div className="col-span-2 text-center text-sm font-extrabold text-gray-800">#{jugador.dorsal}</div>
                  <div className="col-span-2 flex justify-end gap-1.5">
                    <button onClick={() => putJugador(jugador)} className="w-8 h-8 rounded-lg text-sky-600 hover:bg-sky-50 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-lg">edit</span></button>
                    <button onClick={() => deleteJugador(jugador.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginación de 10 en 10 */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500">
                Mostrando <b className="text-gray-800">{currentJugadores.length}</b> de {jugadoresFiltrados.length} futbolistas (Página {currentPage} de {totalPages})
              </span>
              <div className="flex gap-1.5">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="w-8 h-8 border rounded-lg border-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-white shadow-sm cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm font-bold">chevron_left</span></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="w-8 h-8 border rounded-lg border-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-white shadow-sm cursor-pointer transition-colors"><span className="material-symbols-outlined text-sm font-bold">chevron_right</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}