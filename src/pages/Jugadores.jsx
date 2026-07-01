import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useEffect } from "react";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);



export default function Jugadores() {

  const [jugadores, setJugadores] = useState([])

  useEffect(()=> {
      //Apenas se construye mi componente
      getJugadores()
    },[])
  
    //Es un estandar que hace referencia a OBTENER
    async function getJugadores(){
      //Select * from jugadores
      const {data, error} = await supabase.from('jugadores').select('*')
  
      if(error){
        console.error(error)
        return
      }
  
      console.log(data)
      setJugadores(data)
    }

  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
      <div className="text-center">
        <table>
          <tr>
            <th>Nombre</th>
            <th>Posicion</th>
            <th>Número</th>
            <th>Fecha de Nacimiento</th>
            <th>Opciones</th>
          </tr>
          {
            jugadores.map(jugador => (

              <tr>
                <td>{jugador.nombre}</td>
                <td>{jugador.posicion}</td>
                <td>{jugador.dorsal}</td>
                <td>{jugador.fecha_nacimiento}</td>

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
