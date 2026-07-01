import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export default function Equipos() {

  const [equipos, setEquipos] = useState([])

  useEffect(() => {
    //Apenas se construye mi componente
    getEquipos()
  }, [])

  //Es un estandar que hace referencia a OBTENER
  async function getEquipos() {
    //Select * from equipos
    const { data, error } = await supabase.from('equipos').select('*')

    if (error) {
      console.error(error)
      return
    }

    console.log(data);
    setEquipos(data);
  }


  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
      <div className="text-center">
        <table>
          <tr>
            <th>Nombre</th>
            <th>Grupo</th>
            <th>Ranking</th>
            <th>Opciones</th>
          </tr>
          {
            equipos.map(equipo => (

              <tr>
                <td>{equipo.nombre}</td>
                <td>{equipo.grupo}</td>
                <td>{equipo.ranking_fifa}</td>
                <td>
                  <button>Editar</button>
                  <button>Eliminar</button>
                </td>
              </tr>

            ))
          }
          

        </table>

      </div>
    </div>
  )
}
