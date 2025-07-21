import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  const mongoose = await connectToDatabase();
  const Contador = mongoose.connection.collection("settings");

  const doc = await Contador.findOne({ _id: "contador" });

  return new Response(JSON.stringify({ valor: doc?.value || 2500 }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH() {
  const mongoose = await connectToDatabase();
  const Contador = mongoose.connection.collection("settings");

  const upd = await Contador.findOneAndUpdate(
    { _id: "contador" },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return new Response(JSON.stringify({ valor: upd.value.value }), {
    headers: { "Content-Type": "application/json" },
  });
}
