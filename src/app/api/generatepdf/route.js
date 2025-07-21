import { join } from "path";
import { readFileSync } from "fs";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export const maxDuration = 60; // Aumenta el tiempo de ejecución permitido en Vercel

export async function POST(req) {
  try {
    console.log("📥 Iniciando generación de PDF");

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

    const templatePath = join(
      process.cwd(),
      "public",
      "templates",
      `${type}.template.html`
    );

    console.log("🧾 Template path:", templatePath);

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

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    console.log("✅ PDF generado correctamente");

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
