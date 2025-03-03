import { serve } from "bun";

const filePath = "./info.json";
const filePathUser = "./user.json";

async function writeJson(data: any) {
  await Bun.write(filePath, JSON.stringify(data, null, 2));
}

async function writeJsonUser(data: any) {
  await Bun.write(filePathUser, JSON.stringify(data, null, 2));
}

async function readJson() {
  return await Bun.file(filePath).json();
}

async function readJsonUser() {
  return await Bun.file(filePathUser).json();
}

serve({
  fetch: async (req) => {
    const url = new URL(req.url);
    const res = new Response();
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );

    // Mostrar asientos
    if (req.method === "GET" && url.pathname === "/data") {
      const data = await readJson();
      const urlParams = new URL(req.url);
      const movieId = urlParams.searchParams.get("id"); // Obtener el ID de la película desde los parámetros
    
      let response;
    
      if (movieId) {
        // Buscar la película por ID dentro del array
        const movie = data.movies?.find((m: any) => m.id === movieId);
        response = movie ? movie.seats : [];
      } else {
        // Si no se especifica ID, devolver todas las películas
        response = data.movies || [];
      }

      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });
    }

    // Agregar Asientos
    if (req.method === "POST" && url.pathname === "/add-libre") {
      const body = await req.json();
  
      if (!Array.isArray(body.seats) || typeof body.movieName !== "string") {
          return new Response(JSON.stringify({ message: "Formato incorrecto, se esperaba un nombre de película y un array de asientos" }), {
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              },
              status: 400,
          });
      }
  
      const { movieName, seats } = body;
  
      let data = await readJson();
  
      // Verifica que `movies` es un array
      if (!Array.isArray(data.movies)) {
          return new Response(JSON.stringify({ message: "Error en la estructura del JSON, 'movies' debería ser un array" }), {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              },
              status: 500,
          });
      }
  
      // Buscar la película en el array por nombre
      const movieIndex = data.movies.findIndex((movie: any) => movie.title === movieName);
  
      if (movieIndex === -1) {
          return new Response(JSON.stringify({ message: `Película '${movieName}' no encontrada` }), {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              },
              status: 404,
          });
      }
  
      // Obtener la película y asegurar que tenga `seats` como un array
      const movie = data.movies[movieIndex];
  
      if (!Array.isArray(movie.seats)) {
          movie.seats = [];  // Si no existe, inicializarlo como array vacío
      }

      // Agregar nuevos asientos sin sobrescribir los existentes
      movie.seats.push(...seats);

      // Guardar la película actualizada en el array
      data.movies[movieIndex] = movie;

      // Guardar los cambios en el JSON
      await writeJson(data);

      return new Response(
          JSON.stringify({ message: "Asiento agregado", data }),
          {
              headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              },
          },
      );
  }
  

    // Actualizar Asientos
    if (req.method === "POST" && url.pathname === "/update-data") {
      const body = await req.json();

      if (!body.id || !Array.isArray(body.seats)) {
        return new Response(
          JSON.stringify({ message: "Formato incorrecto, se esperaba un movieId y un array de asientos" }),
          {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            },
            status: 400,
          }
        );
      }

      let data = await readJson();
       // Buscar la película por ID dentro del array
      const movie = data.movies?.find((m: any) => m.id === body.id);

      if (!movie) {
        return new Response(
          JSON.stringify({ message: "Película no encontrada" }),
          {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            },
            status: 404,
          }
        );
      }

       // Crear un objeto donde la clave es el ID del asiento para evitar duplicados
      const seatsMap = movie.seats.reduce((acc: any, seat: any) => {
        acc[seat.id] = seat; // Guardar asiento existente
        return acc;
      }, {});

      // Sobrescribir los existentes y agregar los nuevos
      body.seats.forEach((seat:any) => {
        seatsMap[seat.id] = seat; // Si ya existe, lo actualiza, si no, lo agrega
      });
      
      movie.seats = Object.values(seatsMap);

      await writeJson(data);

      return new Response(
        JSON.stringify({ message: "Asiento agregado", data }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
        },
      );
    }

    // Mostrar peliculas
    if (req.method === "GET" && url.pathname === "/peliculas") {
      const data = await readJson();
      return new Response(JSON.stringify(data.movies), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });
    }

    // Agregar Peliculas
    if (req.method === "POST" && url.pathname === "/add-pelicula") {
      const body = await req.json();
      let data = await readJson();
      
      if (!body.id || !body.title || !body.genero) {
        return new Response(JSON.stringify({ message: "Datos incompletos" }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
          status: 400,
        });
      }

      // Verificar si la película ya existe
      const existingMovieIndex = data.movies.findIndex((movie: any) => movie.id === body.id);

      if (existingMovieIndex !== -1) {
        // Actualizar película existente
        data.movies[existingMovieIndex] = body;
      } else {
        // Agregar nueva película
        data.movies.push(body);
      }

      await writeJson(data);
      
      return new Response(
        JSON.stringify({ message: "Pelicula agregado", data }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
        },
      );
    }

    // Eliminar Peliculas
    if (req.method === "POST" && url.pathname === "/remove-movie") {
      const body = await req.json();
      let data = await readJson();
      
      if (!body.id) {
        return new Response(JSON.stringify({ message: "ID de película requerido" }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
          status: 400,
        });
      }
  
      if (!Array.isArray(data.movies)) {
        return new Response(JSON.stringify({ message: "No hay películas en cartelera" }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
          status: 404,
        });
      }
  
      // Filtramos para eliminar la película con el ID dado
      const updatedMovies = data.movies.filter((movie: { id: string; }) => movie.id !== body.id);
  
      // Si no se eliminó ninguna, significa que el ID no existe
      if (updatedMovies.length === data.movies.length) {
        return new Response(JSON.stringify({ message: "Película no encontrada" }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
          status: 404,
        });
      }
  
      // Guardamos el nuevo listado de películas
      data.movies = updatedMovies;
      await writeJson(data);
      
      return new Response(
        JSON.stringify({ message: "Película eliminada", data }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          },
        },
      );
  }

    // Mostrar usuarios
  if (req.method === "GET" && url.pathname === "/users") {
    const data = await readJsonUser();
    return new Response(JSON.stringify(data.users), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  }

  // Agregar Usuarios
  if (req.method === "POST" && url.pathname === "/add-user") {
    const body = await req.json();
    let data = await readJsonUser();
    
    if (!body.name || !Array.isArray(body.seats)) {
      return new Response(JSON.stringify({ message: "Datos incompletos" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 400,
      });
    }

    if (!Array.isArray(data.users)) {
      data.users = [];
    }

    const existingUserIndex = data.users.findIndex((user: any) => user.name === body.name);
    if (existingUserIndex !== -1) {
      data.users[existingUserIndex] = body;
    } else {
      data.users.push(body);
    }

    await writeJsonUser(data);
    
    return new Response(
      JSON.stringify({ message: "Usuario agregado", data }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      },
    );
  }

  // Eliminar Usuarios
  if (req.method === "POST" && url.pathname === "/remove-user") {
    const body = await req.json();
    let data = await readJsonUser();

    if (!body.name) {
      return new Response(JSON.stringify({ message: "Nombre de usuario requerido" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 400,
      });
    }

    if (!Array.isArray(data.users)) {
      return new Response(JSON.stringify({ message: "No hay usuarios" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 404,
      });
    }

    const updatedUsers = data.users.filter((user: { name: string; }) => user.name !== body.name);

    if (updatedUsers.length === data.users.length) {
      return new Response(JSON.stringify({ message: "Usuario no encontrado" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 404,
      });
    }

    data.users = updatedUsers;
    await writeJsonUser(data);

    return new Response(
      JSON.stringify({ message: "Usuario eliminado", data }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      },
    );
  }

  // Eliminar usuarios con asientos en películas eliminadas
  if (req.method === "POST" && url.pathname === "/remove-users-by-movie") {
    const body = await req.json();
    let data = await readJsonUser();
    
    if (!body.id) {
      return new Response(JSON.stringify({ message: "El id de la película es requerido" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 400,
      });
    }

    if (!Array.isArray(data.users)) {
      return new Response(JSON.stringify({ message: "No hay usuarios registrados" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 404,
      });
    }

    // Filtrar usuarios eliminando los que tengan relación con la película indicada
    const updatedUsers = data.users.filter((user: { movie: { id: string; }; }) => user.movie.id !== body.id);

    // Si no se eliminó ningún usuario, significa que no había ninguno con esa película
    if (updatedUsers.length === data.users.length) {
      return new Response(JSON.stringify({ message: "No se encontraron usuarios con esa película" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        status: 404,
      });
    }

    // Guardamos el nuevo listado de usuarios
    data.users = updatedUsers;
    await writeJsonUser(data);
    
    return new Response(
      JSON.stringify({ message: "Usuarios eliminados correctamente", data }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      },
    );
}

    return new Response("Ruta no encontrada", { status: 404 });
  },

  port: 3000,
});

console.log("Server run in http://localhost:3000");
