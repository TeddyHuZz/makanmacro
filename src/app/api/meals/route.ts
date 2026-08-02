import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function getOrCreateUser(session: any) {
  if (!session?.user) return null;
  const email = session.user.email || `guest_${session.user.id}@makanmacro.local`;
  const name = session.user.name || "User";
  const image = session.user.image;

  let user = await db.user.findFirst({
    where: { OR: [{ email }] },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        name,
        image,
      },
    });
  }
  return user;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser(session);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const meals = await db.mealLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, meals });
  } catch (error: any) {
    console.error("GET /api/meals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser(session);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    // Check if bulk sync payload or single meal creation
    if (Array.isArray(body.meals)) {
      const createdMeals = await Promise.all(
        body.meals.map((m: any) =>
          db.mealLog.create({
            data: {
              userId: user.id,
              name: m.name || "Meal Log",
              time: m.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              type: m.type || "Meal Scan",
              calories: parseInt(m.calories) || 0,
              protein: parseInt(m.protein) || 0,
              carbs: parseInt(m.carbs) || 0,
              fat: parseInt(m.fat) || 0,
              emoji: m.emoji || "🍱",
              imageUrl: m.imageUrl || null,
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
            },
          })
        )
      );
      return NextResponse.json({ success: true, meals: createdMeals });
    }

    const { name, time, type, calories, protein, carbs, fat, emoji, imageUrl, createdAt } = body;

    const meal = await db.mealLog.create({
      data: {
        userId: user.id,
        name: name || "Meal Log",
        time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: type || "Meal Scan",
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        emoji: emoji || "🍱",
        imageUrl: imageUrl || null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, meal });
  } catch (error: any) {
    console.error("POST /api/meals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser(session);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearToday = searchParams.get("clearToday");

    if (clearToday === "true") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.mealLog.deleteMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: today,
          },
        },
      });
      return NextResponse.json({ success: true, message: "Cleared today's meals" });
    }

    if (id) {
      await db.mealLog.delete({
        where: { id, userId: user.id },
      });
      return NextResponse.json({ success: true, message: "Deleted meal" });
    }

    return NextResponse.json({ success: false, error: "Meal ID missing" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/meals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
