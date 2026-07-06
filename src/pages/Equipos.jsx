import { useState, useEffect } from "react"
import { supabase } from "../utils/supabaseClient"

export default function Equipos() {
  // Estados para la lista y paginación
  const [equipos, setEquipos] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 🔥 ESTADOS PARA LOS NUEVOS FILTROS SUPERIORES (RECUADRO ROJO)
  const [busquedaNombre, setBusquedaNombre] = useState("")
  const [filtroGrupo, setFiltroGrupo] = useState("")
  const [filtroConfederacion, setFiltroConfederacion] = useState("")

  // Estados del Formulario
  const [nombre, setNombre] = useState("")
  const [grupo, setGrupo] = useState("")
  const [ranking, setRanking] = useState("")
  const [confederacion, setConfederacion] = useState("")
  const [equipoId, setEquipoId] = useState("")
  const [editarEquipo, setEditarEquipo] = useState(false)

  // Estado para la notificación personalizada
  const [toast, setToast] = useState({ mostrar: false, mensaje: "" })

  const opcionesGrupos = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  const opcionesConfederaciones = ["CONMEBOL", "UEFA", "CONCACAF", "CAF", "AFC", "OFC"]

  useEffect(() => {
    getEquipos()
  }, [])

  function lanzarToast(mensaje) {
    setToast({ mostrar: true, mensaje })
  }

  function manejarCierreToast() {
    setToast({ mostrar: false, mensaje: "" })
    limpiarFormulario()
  }

  async function getEquipos() {
    const { data, error } = await supabase
      .from('equipos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      console.error(error)
      lanzarToast("Error al obtener los equipos de la base de datos.")
      return
    }
    setEquipos(data || [])
  }

  async function deleteEquipo(id) {
    const { data: partidos, error: errorPartidos } = await supabase
      .from('partidos')
      .select('id')
      .or(`local_id.eq.${id},visitante_id.eq.${id}`)
      .limit(1)

    if (errorPartidos) {
      lanzarToast("Error al validar las restricciones del equipo.")
      return
    }

    if (partidos && partidos.length > 0) {
      lanzarToast("No se puede eliminar el equipo porque tiene partidos registrados en el torneo.")
      return
    }

    const { error } = await supabase
      .from('equipos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      lanzarToast("No se pudo eliminar el equipo.")
      return
    }

    getEquipos()
  }

  async function postEquipo(e) {
    e.preventDefault()
    const nombreFormateado = nombre.trim().toUpperCase()

    if (!nombreFormateado || !grupo || !ranking || !confederacion) {
      lanzarToast("Por favor, completa todos los campos del formulario.")
      return
    }

    const existeNombre = equipos.some(
      eq => eq.nombre.trim().toUpperCase() === nombreFormateado
    )
    if (existeNombre) {
      lanzarToast(`La selección de "${nombreFormateado}" ya se encuentra registrada.`)
      return 
    }

    const { error } = await supabase
      .from('equipos')
      .insert({
        nombre: nombreFormateado,
        grupo: grupo.trim().toUpperCase(),
        ranking_fifa: parseInt(ranking, 10),
        confederaciones: confederacion.trim().toUpperCase()
      })

    if (error) {
      console.error(error)
      lanzarToast("Error al insertar el equipo en la base de datos.")
      return
    }

    limpiarFormulario()
    getEquipos()
  }

  function putEquipo(equipo) {
    setNombre(equipo.nombre.toUpperCase())
    setGrupo(equipo.grupo.toUpperCase())
    setRanking(equipo.ranking_fifa.toString())
    setConfederacion((equipo.confederaciones || "").toUpperCase())
    setEquipoId(equipo.id)
    setEditarEquipo(true)
  }

  async function updateEquipo(e) {
    e.preventDefault()
    const nombreFormateado = nombre.trim().toUpperCase()

    if (!nombreFormateado || !grupo || !ranking || !confederacion) {
      lanzarToast("Por favor, completa todos los campos del formulario.")
      return
    }

    const existeNombre = equipos.some(
      eq => eq.nombre.trim().toUpperCase() === nombreFormateado && eq.id !== equipoId
    )
    if (existeNombre) {
      lanzarToast(`No puedes renombrarlo a "${nombreFormateado}" because ya existe otra selección con ese nombre.`)
      return 
    }

    const { error } = await supabase
      .from('equipos')
      .update({
        nombre: nombreFormateado,
        grupo: grupo.trim().toUpperCase(),
        ranking_fifa: parseInt(ranking, 10),
        confederaciones: confederacion.trim().toUpperCase()
      })
      .eq('id', equipoId)

    if (error) {
      console.error(error)
      lanzarToast("Error al actualizar el equipo.")
      return
    }

    limpiarFormulario()
    getEquipos()
  }

  function limpiarFormulario() {
    setNombre("")
    setGrupo("")
    setRanking("")
    setConfederacion("")
    setEquipoId("")
    setEditarEquipo(false)
  }

  /* =========================================================================
     🎯 LÓGICA DE FILTRADO DINÁMICO (EN TIEMPO REAL)
     ========================================================================= */
  const equiposFiltrados = equipos.filter(eq => {
    const cumpleNombre = eq.nombre.toLowerCase().includes(busquedaNombre.toLowerCase())
    const cumpleGrupo = filtroGrupo === "" || eq.grupo.trim().toUpperCase() === filtroGrupo.toUpperCase()
    const cumpleConf = filtroConfederacion === "" || (eq.confederaciones || "").trim().toUpperCase() === filtroConfederacion.toUpperCase()

    return cumpleNombre && cumpleGrupo && cumpleConf
  })

  // Ajustar paginación sobre la lista filtrada
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentEquipos = equiposFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(equiposFiltrados.length / itemsPerPage)

  // Forzar regreso a página 1 cuando el usuario busque para que no quede la grilla vacía
  useEffect(() => {
    setCurrentPage(1)
  }, [busquedaNombre, filtroGrupo, filtroConfederacion])

  return (
    <div className="flex flex-col gap-8 relative animate-fade-in duration-300">
      
      {/* Toast Informativo */}
      {toast.mostrar && (
        <div className="fixed top-20 right-6 z-50 bg-white border-l-4 border-red-500 rounded-xl p-4 shadow-xl flex items-center gap-4 max-w-md border border-gray-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Aviso del Sistema</span>
            <p className="text-sm font-semibold text-red-700">{toast.mensaje}</p>
          </div>
          <button 
            type="button"
            onClick={manejarCierreToast}
            className="ml-auto w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-red-500 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Cabecera de Página con la Barra de Filtros integrada (Área Roja) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Equipos</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Registra, edita o remueve las selecciones participantes del torneo.
          </p>
        </div>

        {/* 🛠️ BARRA DE BÚSQUEDA Y FILTROS SUPERIOR */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200/80 shadow-xs">
          {/* Input de búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar país..."
              value={busquedaNombre}
              onChange={e => setBusquedaNombre(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-sky-500 min-w-[160px]"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-gray-400 text-sm">search</span>
          </div>

          {/* Selector Grupo */}
          <select
            value={filtroGrupo}
            onChange={e => setFiltroGrupo(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-sky-500 cursor-pointer"
          >
            <option value="">TODOS LOS GRUPOS</option>
            {opcionesGrupos.map(g => (
              <option key={g} value={g}>GRUPO {g}</option>
            ))}
          </select>

          {/* Selector Confederación */}
          <select
            value={filtroConfederacion}
            onChange={e => setFiltroConfederacion(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 focus:outline-sky-500 cursor-pointer"
          >
            <option value="">TODAS LAS CONF.</option>
            {opcionesConfederaciones.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Botón de reset dinámico */}
          {(busquedaNombre || filtroGrupo || filtroConfederacion) && (
            <button
              onClick={() => { setBusquedaNombre(""); setFiltroGrupo(""); setFiltroConfederacion(""); }}
              className="p-1 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors cursor-pointer flex items-center"
              title="Limpiar filtros"
            >
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Panel del Formulario */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg text-gray-900 mb-5 font-bold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600">split_scene</span>
            {editarEquipo ? "Modificar Selección" : "Nueva Selección"}
          </h3>
          
          <form onSubmit={editarEquipo ? updateEquipo : postEquipo} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nombre del Equipo</label>
              <input
                type="text"
                placeholder="EJ. ARGENTINA"
                value={nombre}
                onChange={e => setNombre(e.target.value.toUpperCase())}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-sky-500 focus:bg-white transition-all uppercase placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Grupo (Letra)</label>
              <select
                value={grupo}
                onChange={e => setGrupo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-bold focus:outline-sky-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">SELECCIONA LETRA</option>
                {opcionesGrupos.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ranking FIFA</label>
              <input
                type="number"
                placeholder="Ej. 1"
                value={ranking}
                onChange={e => setRanking(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Confederación</label>
              <select
                value={confederacion}
                onChange={e => setConfederacion(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-sky-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">SELECCIONE CONFEDERACIÓN</option>
                {opcionesConfederaciones.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                className="flex-1 bg-sky-600 text-white font-bold text-sm py-2.5 rounded-xl shadow-sm hover:bg-sky-700 transition-colors cursor-pointer"
              >
                {editarEquipo ? "Guardar Cambios" : "Agregar Equipo"}
              </button>
              {editarEquipo && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="bg-gray-100 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Panel del Grid / Tabla de Equipos */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-sky-100 text-sky-900 text-xs font-black uppercase tracking-wider border-b border-sky-200/60">
              <div className="col-span-4 flex items-center">Nombre</div>
              <div className="col-span-2 text-center flex items-center justify-center">Grupo</div>
              <div className="col-span-2 text-center flex items-center justify-center">Ranking</div>
              <div className="col-span-2 text-center flex items-center justify-center">Confederación</div>
              <div className="col-span-2 text-right flex items-center justify-end">Acciones</div>
            </div>

            {currentEquipos.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm font-medium">
                No hay selecciones que coincidan con la búsqueda.
              </div>
            ) : (
              currentEquipos.map(equipo => (
                <div
                  key={equipo.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="col-span-4 text-sm font-bold text-gray-900 uppercase truncate">
                    {equipo.nombre}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-1 rounded-lg font-extrabold">
                      GRUPO {equipo.grupo}
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-sm font-semibold text-gray-500">
                    #{equipo.ranking_fifa}
                  </div>
                  <div className="col-span-2 text-center text-xs font-bold text-gray-600 uppercase">
                    {equipo.confederaciones || "—"}
                  </div>
                  <div className="col-span-2 flex justify-end gap-1.5">
                    <button
                      onClick={() => putEquipo(equipo)}
                      className="w-8 h-8 rounded-lg text-sky-600 hover:bg-sky-50 flex items-center justify-center cursor-pointer transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => deleteEquipo(equipo.id)}
                      className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Barra inferior de Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500">
                Mostrando <b className="text-gray-800">{currentEquipos.length}</b> de {equiposFiltrados.length} selecciones filtradas
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white text-gray-600 bg-white shadow-sm cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white text-gray-600 bg-white shadow-sm cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}