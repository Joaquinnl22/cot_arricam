import { join } from "path";
import { readFileSync } from "fs";
import puppeteer from "puppeteer";

export async function POST(req) {
  try {
    const {
      type,
      date,
      client,
      company,
      quoteNumber,
      items = [],
      dispatch = 0,
      guarantee = 0,
    } = await req.json();

    console.log("🔧 Recibido tipo:", type);
    console.log("🔧 Items:", items.length, items);

    const templatePath = join(
      process.cwd(),
      "public",
      "templates",
      `${type}.template.html`
    );

    console.log("📄 Cargando template desde:", templatePath);

    let html;
    try {
      html = readFileSync(templatePath, "utf8");
    } catch (err) {
      console.error("❌ No se pudo leer el archivo:", err);
      return new Response(
        JSON.stringify({ message: "Template no encontrado", error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const allItems = [...items];
    if (dispatch > 0) {
      allItems.push({
        name: "Despacho",
        description: "Costo de envío",
        quantity: 1,
        price: dispatch,
      });
    }

    const itemsHtml = allItems
      .map(
        (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.description || "-"}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toLocaleString()}</td>
          <td>$${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `
      )
      .join("");

    const net = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const iva = Math.round(net * 0.19);
    const total = net + iva;
    const finalTotal = total + guarantee;

    html = html
      .replace(/{{date}}/g, date)
      .replace(/{{client}}/g, client)
      .replace(/{{company}}/g, company)
      .replace(/{{quoteNumber}}/g, quoteNumber)
      .replace(/{{items}}/g, itemsHtml)
      .replace(/{{net}}/g, net.toLocaleString())
      .replace(/{{iva}}/g, iva.toLocaleString())
      .replace(/{{total}}/g, total.toLocaleString())
      .replace(/{{guarantee}}/g, guarantee.toLocaleString())
      .replace(/{{finalTotal}}/g, finalTotal.toLocaleString());

    console.log("✅ Template procesado, iniciando puppeteer");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    console.log("📄 PDF generado correctamente");

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cotizacion-${quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    return new Response(
      JSON.stringify({ message: "Error al generar PDF", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
