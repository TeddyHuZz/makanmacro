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

    const weights = await db.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, weights });
  } catch (error: any) {
    console.error("GET /api/weights error:", error);
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

    if (Array.isArray(body.weights)) {
      const createdWeights = await Promise.all(
        body.weights.map((w: any) =>
          db.weightLog.create({
            data: {
              userId: user.id,
              weight: parseFloat(w.weight) || 70,
              date: w.date ? new Date(w.date) : new Date(),
            },
          })
        )
      );
      return NextResponse.json({ success: true, weights: createdWeights });
    }

    const { weight, date } = body;

    const weightEntry = await db.weightLog.create({
      data: {
        userId: user.id,
        weight: parseFloat(weight) || 70,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ success: true, weight: weightEntry });
  } catch (error: any) {
    console.error("POST /api/weights error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
