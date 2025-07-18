import connectToDatabase from "@/lib/mongodb";
import { Producto } from "@/models/Producto";

export async function GET() {
  try {
    await connectToDatabase();
    const productos = await Producto.find().sort({ createdAt: -1 });
    return new Response(JSON.stringify(productos), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error al obtener productos", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { nombre, descripcion = "", estado = "venta", precio } = body;

    if (!nombre || precio == null) {
      return new Response(
        JSON.stringify({ message: "Campos requeridos faltantes" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const nuevo = new Producto({ nombre, descripcion, estado, precio });
    await nuevo.save();

    return new Response(JSON.stringify(nuevo), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error interno", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

