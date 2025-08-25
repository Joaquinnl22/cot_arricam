import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  const mongoose = await connectToDatabase();
  const Contador = mongoose.connection.collection("settings");

  const doc = await Contador.findOne({ _id: "contadorOrdenCompra" });

  return new Response(JSON.stringify({ valor: doc?.value || 1950 }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH() {
  const mongoose = await connectToDatabase();
  const Contador = mongoose.connection.collection("settings");

  // Obtener el documento actual
  let currentDoc = await Contador.findOne({ _id: "contadorOrdenCompra" });
  console.log("🔍 Documento actual:", currentDoc);
  
  // Si no existe, crear con valor 1950
  if (!currentDoc) {
    console.log("➕ Creando nuevo documento con valor 1950");
    await Contador.insertOne({ _id: "contadorOrdenCompra", value: 1950 });
    currentDoc = { value: 1950 };
  }
  
  // Calcular nuevo valor
  const newValue = currentDoc.value + 1;
  console.log("📈 Incrementando de", currentDoc.value, "a", newValue);
  
  // Actualizar con el nuevo valor
  await Contador.updateOne(
    { _id: "contadorOrdenCompra" },
    { $set: { value: newValue } }
  );

  console.log("✅ Contador actualizado a:", newValue);
  return new Response(JSON.stringify({ valor: newValue }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT() {
  const mongoose = await connectToDatabase();
  const Contador = mongoose.connection.collection("settings");

  const upd = await Contador.findOneAndUpdate(
    { _id: "contadorOrdenCompra" },
    { value: 1950 },
    { upsert: true, returnDocument: "after" }
  );

  return new Response(JSON.stringify({ valor: upd.value.value }), {
    headers: { "Content-Type": "application/json" },
  });
} 