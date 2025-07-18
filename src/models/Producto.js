import mongoose from "mongoose";

const ProductoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    estado: { type: String, enum: ["venta", "arriendo"], default: "venta" },
    precio: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Producto = mongoose.models.Producto || mongoose.model("Producto", ProductoSchema);
