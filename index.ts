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

    // Mostrar los datos del Json
    if (req.method === "GET" && url.pathname === "/data") {
      const data = await readJson();
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });
    }

    // Agregar datos al Json
    if (req.method === "POST" && url.pathname === "/add-libre") {
      const body = await req.json();

      if (!Array.isArray(body)) {
        return new Response(JSON.stringify({ message: "Formato incorrecto, se esperaba un array" }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      }

      let data = await readJson();

      // Crear un objeto donde la clave es el ID para evitar duplicados
      const seatsMap = data.seats.reduce((acc: any, seat: any) => {
        acc[seat.id] = seat; // Guardar asiento existente
        return acc;
      }, {});

      // Sobrescribir los existentes y agregar los nuevos
      body.forEach((seat) => {
        seatsMap[seat.id] = seat; // Si ya existe, lo actualiza; si no, lo agrega
      });
      
      data.seats = Object.values(seatsMap);

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

    // Actualizar datos al Json
    if (req.method === "POST" && url.pathname === "/update-data") {
      const body = await req.json();

      let data = await readJson();

      const seat = data.seats.find((s: any) => s.id === body.id);
      if (seat) {
        seat.status = body.status; // Modificar solo el campo necesario
        await writeJson(data);
        return new Response(
          JSON.stringify({ message: "Datos actualizados correctamente", data }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            },
          },
        );
      } else {
        return new Response(
          JSON.stringify({ message: "Asiento no encontrado" }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            },
          },
        );
      }
    }

    return new Response("Ruta no encontrada", { status: 404 });
  },

  port: 3000,
});

console.log("Server run in http://localhost:3000");
