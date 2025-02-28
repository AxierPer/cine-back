import { serve } from "bun";

const filePath = "./info.json";

async function writeJson(data: string) {
  await Bun.write(filePath, JSON.stringify(data, null, 2));
}

async function readJson() {
  return await Bun.file(filePath).json();
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
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }
    
      const { movieName, seats } = body;
    
      let data = await readJson();
    
      // Si no existe la película en el JSON, se crea
      if (!data.movies) {
        data.movies = {}; // Se asegura de que haya una estructura de películas
      }
    
      if (!data.movies[movieName]) {
        data.movies[movieName] = { seats: [] };
      }
    
      // Mapa de asientos existentes para evitar duplicados
      const seatsMap = data.movies[movieName].seats.reduce((acc: any, seat: any) => {
        acc[seat.id] = seat;
        return acc;
      }, {});
    
      // Agregar o actualizar los asientos
      seats.forEach((seat:any) => {
        seatsMap[seat.id] = seat;
      });
    
      // Guardar la nueva lista de asientos para la película
      data.movies[movieName].seats = Object.values(seatsMap);
    
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
        seatsMap[seat.id] = seat; // Si ya existe, lo actualiza; si no, lo agrega
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
      console.log(body);
      
      if (!body.id || !body.title || !body.genre) {
        return new Response(JSON.stringify({ message: "Datos incompletos" }), {
          headers: { "Content-Type": "application/json" },
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

    return new Response("Ruta no encontrada", { status: 404 });
  },

  port: 3000,
});

console.log("Server run in http://localhost:3000");
