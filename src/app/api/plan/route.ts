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

    const plan = await db.userPlan.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("GET /api/plan error:", error);
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
    const {
      weightKg,
      heightCm,
      age,
      gender,
      activity,
      goal,
      bmr,
      tdee,
      targetCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
    } = body;

    const plan = await db.userPlan.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        weightKg: parseFloat(weightKg) || 70,
        heightCm: parseFloat(heightCm) || 165,
        age: parseInt(age) || 25,
        gender: gender || "female",
        activity: activity || "moderate",
        goal: goal || "lose",
        bmr: parseInt(bmr) || 1500,
        tdee: parseInt(tdee) || 2000,
        targetCalories: parseInt(targetCalories) || 1500,
        proteinGrams: parseInt(proteinGrams) || 110,
        carbsGrams: parseInt(carbsGrams) || 170,
        fatGrams: parseInt(fatGrams) || 42,
      },
      update: {
        weightKg: parseFloat(weightKg) || 70,
        heightCm: parseFloat(heightCm) || 165,
        age: parseInt(age) || 25,
        gender: gender || "female",
        activity: activity || "moderate",
        goal: goal || "lose",
        bmr: parseInt(bmr) || 1500,
        tdee: parseInt(tdee) || 2000,
        targetCalories: parseInt(targetCalories) || 1500,
        proteinGrams: parseInt(proteinGrams) || 110,
        carbsGrams: parseInt(carbsGrams) || 170,
        fatGrams: parseInt(fatGrams) || 42,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("POST /api/plan error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
