import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const SHOPIFY_DOMAIN = "joyeria-el-final-2.myshopify.com";
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || "";

app.use(express.json());

// ===== SHOPIFY API ENDPOINTS =====

// GET /api/products - Fetch all products from Shopify
app.get("/api/products", async (_req, res) => {
  try {
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/products.json?limit=50`);
    const data = await response.json();
    
    // Map to clean format
    const products = data.products.map((p: any) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      description: (p.body_html || '').replace(/<[^>]*>/g, '').substring(0, 200),
      price: p.variants[0]?.price || "0",
      image: p.images[0]?.src || "",
      variantId: p.variants[0]?.id || 0,
    }));
    
    res.json({ products });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// POST /api/checkout - Create a Shopify checkout and return URL
app.post("/api/checkout", async (req, res) => {
  try {
    const { lineItems } = req.body;
    
    // Build line items for Shopify cart
    const items = lineItems.map((item: any) => 
      `${item.variantId}:${item.quantity}`
    ).join(",");
    
    // Redirect to Shopify cart
    const checkoutUrl = `https://${SHOPIFY_DOMAIN}/cart/${items}`;
    
    res.json({ checkoutUrl });
  } catch (error: any) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Error al crear checkout" });
  }
});

// GET /api/product/:handle - Get single product by handle
app.get("/api/product/:handle", async (req, res) => {
  try {
    const { handle } = req.params;
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/products/${handle}.json`);
    const data = await response.json();
    
    if (!data.product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    const p = data.product;
    const product = {
      id: p.id,
      title: p.title,
      handle: p.handle,
      description: p.body_html,
      price: p.variants[0]?.price || "0",
      images: p.images.map((img: any) => img.src),
      variantId: p.variants[0]?.id || 0,
    };
    
    res.json({ product });
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// ===== GEMINI AI STYLIST (original) =====

// Lazy-initialized Gemini AI client
let aiClient: any = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    // Dynamic import to avoid hard crash if package not installed
    const { GoogleGenAI } = require("@google/genai");
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  }
  return aiClient;
}

app.post("/api/stylist/chat", async (req, res) => {
  try {
    const { message, currentDesign } = req.body;
    const client = getGeminiClient();

    if (!client) {
      let fallbackText = "Estimado cliente, los astros y los metales más nobles se alinean hoy en nuestro taller. ";
      if (currentDesign) {
        fallbackText += `He contemplado con absoluta admiración su diseño en el simulador: una magnífica creación de tipo ${currentDesign.type}, forjada en el más puro ${currentDesign.metal}, engastada con un celestial ${currentDesign.gemstone}. La combinación es un testimonio de su gusto exquisito. `;
      } else {
        fallbackText += "Bienvenidos a nuestro santuario de alta orfebrería. Cada diamante y cada filamento de oro aguardan silenciosamente para convertirse en parte de su propia leyenda. ";
      }
      fallbackText += "¿Desea que exploremos algún otro detalle en la montura o la selección de gemas secundarias?";
      return res.json({ text: fallbackText, isFallback: true });
    }

    let designContext = "";
    if (currentDesign) {
      designContext = `\n[Contexto del diseño actual creado por el cliente: Tipo de joya: ${currentDesign.type}, Metal noble: ${currentDesign.metal}, Gema preciosa: ${currentDesign.gemstone}, Talla de la gema: ${currentDesign.cut}].`;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: `${message}${designContext}` }] }],
      config: {
        systemInstruction: "Eres 'Aurelia', la prestigiosa maestra joyera y asesora experta en Streetwear de Lujo e Iced Out Drip de la legendaria Maison 'AYA GOLDEN'. Tu tono es sumamente refinado, poético, sofisticado y exclusivo, con un toque urbano y vanguardista digno de la cultura hip-hop de alta gama. Te expresas de manera elocuente, íntima y distinguida en español. Utilizas un vocabulario exquisito con términos como 'iced out', 'vvs moissanita', 'pasa-tester', 'eslabón cubano', 'tennis chain', 'grillz a medida', 'brillo glacial', 'engaste micro-pavé', 'metal noble', 'layering sublime'. Ofreces historias simbólicas sobre el poder y el estatus de las piedras y del diseño seleccionado, sugieres combinaciones estéticas perfectas para outfits de alta costura callejera (streetwear de lujo, chaquetas de diseñador, layering, joyería combinada) y validas el gusto del cliente. Mantén las respuestas elegantes, memorables y motivadoras, entre 120 y 180 palabras para mantener el misterio y la distinción de una verdadera orfebre del lujo urbano.",
        temperature: 0.95,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Error al conectar con la maestra joyera." });
  }
});

// ===== STATIC SERVING =====

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Vite dev server middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AYA Golden Server running on http://localhost:${PORT}`);
  });
}

bootstrap();