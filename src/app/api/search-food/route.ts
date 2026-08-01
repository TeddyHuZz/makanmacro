import { NextResponse } from "next/server";

// Open Food Facts Search Helper with 1000ms Abort Limit
async function searchOpenFoodFacts(query: string) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      `${query} Malaysia`
    )}&search_simple=1&action=process&json=1&page_size=5`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "MakanMacroAsianDatabase/1.0 (https://makanmacro.com)",
      },
      signal: AbortSignal.timeout(1000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const items: any[] = [];

    data.products?.slice(0, 3).forEach((p: any) => {
      const n = p.nutriments;
      if (n && (n["energy-kcal_100g"] || n["energy-kcal"])) {
        const cals = Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0) * 2.5;
        const protein = Math.round(n["proteins_100g"] || 0) * 2.5;
        const carbs = Math.round(n["carbohydrates_100g"] || 0) * 2.5;
        const fat = Math.round(n["fat_100g"] || 0) * 2.5;

        if (cals > 0) {
          items.push({
            name: p.product_name || query,
            calories: Math.round(cals),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            emoji: "📦",
            source: "Open Food Facts DB",
          });
        }
      }
    });

    return items;
  } catch (e) {
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const searchQuery = query.trim();

    // 1. STEP 1: QUERY OPEN FOOD FACTS DATABASE FIRST (Zero AI Quota Cost)
    const dbResults = await searchOpenFoodFacts(searchQuery);

    // If database returned valid entries, return immediately without calling AI API!
    if (dbResults.length > 0) {
      return NextResponse.json({
        success: true,
        source: "database",
        results: dbResults,
      });
    }

    // 2. STEP 2: SMART AI FALLBACK ONLY WHEN DB IS EMPTY
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey && geminiKey.length > 5) {
      const geminiModels = ["gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3-flash"];
      for (const modelName of geminiModels) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are MakanMacro AI nutritionist specialized in Malaysian & Asian cuisine.
Analyze the user food search query: "${searchQuery}".
Provide authentic Malaysian/Asian standard nutritional estimate.
Return raw JSON format ONLY:
{
  "name": "Standard Dish Name (e.g. Teh O Ais)",
  "calories": 85,
  "protein": 0,
  "carbs": 21,
  "fat": 0,
  "emoji": "🧊",
  "source": "✨ Gemini AI Smart Estimate"
}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  response_mime_type: "application/json",
                  temperature: 0.1,
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const geminiJson = await geminiRes.json();
            const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              return NextResponse.json({
                success: true,
                source: "gemini-ai",
                results: [parsed],
              });
            }
          }
        } catch (mErr) {
          // try next model
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: "none",
      results: [],
    });
  } catch (error: any) {
    console.error("Search Food Route Error:", error);
    return NextResponse.json(
      { error: "Failed to perform food search." },
      { status: 500 }
    );
  }
}
