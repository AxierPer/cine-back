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

    if (req.method === "GET" && url.pathname === "/data") {
      const data = await readJson();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && url.pathname === "/add-libre") {
      const body = await req.json();
      let data = await readJson();
      data.libres.push({ id: data.libres.length + 1, asiento: body.asiento });
      await writeJson(data);
      return new Response(
        JSON.stringify({ message: "Asiento agregado", data }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    if (req.method === "POST" && url.pathname === "/add-ocupated") {
      const body = await req.json();
      let data = await readJson();
      data.ocupados.push({ id: data.libres.length + 1, asiento: body.asiento });
      await writeJson(data);
      return new Response(
        JSON.stringify({ message: "Asiento agregado", data }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "POST" && url.pathname === "/remove-ocupated") {
      const body = await req.json();
      let data = await readJson();
      data.libres.push({ id: data.libres.length + 1, asiento: body.asiento });
      await writeJson(data);
      return new Response(
        JSON.stringify({ message: "Asiento agregado", data }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Ruta no encontrada", { status: 404 });
  },

  port: 3000,
});

console.log("Server run in http://localhost:3000");
