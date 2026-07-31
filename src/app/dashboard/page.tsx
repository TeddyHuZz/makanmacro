"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Camera,
  LogOut,
  Flame,
  Wheat,
  Drumstick,
  Droplet,
  Utensils,
  Plus,
  BarChart3,
  PlusCircle,
  Trash2,
} from "lucide-react";

interface MealLog {
  id: string;
  name: string;
  time: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Dynamic meal log & user plan state
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [proteinTarget, setProteinTarget] = useState<number>(130);
  const [carbsTarget, setCarbsTarget] = useState<number>(220);
  const [fatTarget, setFatTarget] = useState<number>(65);
  const [userGoal, setUserGoal] = useState<string>("maintain");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    try {
      const savedPlanStr = localStorage.getItem("makanmacro_user_plan");
      if (savedPlanStr) {
        const plan = JSON.parse(savedPlanStr);
        if (plan.targetCalories) setTargetCalories(plan.targetCalories);
        if (plan.proteinGrams) setProteinTarget(plan.proteinGrams);
        if (plan.carbsGrams) setCarbsTarget(plan.carbsGrams);
        if (plan.fatGrams) setFatTarget(plan.fatGrams);
        if (plan.goal) setUserGoal(plan.goal);
      } else {
        router.push("/onboarding");
      }
    } catch (e) {
      console.error("Failed to parse saved plan", e);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Camera className="w-6 h-6 text-emerald-500 animate-pulse" />
        </div>
        <p className="mt-3 text-xs text-zinc-500 font-medium">Loading MakanMacro...</p>
      </div>
    );
  }

  const user = session?.user;

  // Calculate totals from meal logs
  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);

  const remainingCalories = Math.max(0, targetCalories - totalCalories);
  const progressPercent = Math.min(100, (totalCalories / targetCalories) * 100);

  const handleAddSampleMeal = () => {
    const sampleMeals: Omit<MealLog, "id">[] = [
      {
        name: "Nasi Lemak Ayam Goreng",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "Breakfast",
        calories: 644,
        protein: 28,
        carbs: 68,
        fat: 28,
        emoji: "🍛",
      },
      {
        name: "Teh Tarik (Kurang Manis)",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "Snack",
        calories: 140,
        protein: 3,
        carbs: 18,
        fat: 6,
        emoji: "🥤",
      },
      {
        name: "Roti Canai with Dhal",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "Lunch",
        calories: 360,
        protein: 9,
        carbs: 48,
        fat: 15,
        emoji: "🫓",
      },
    ];

    const randomSample = sampleMeals[meals.length % sampleMeals.length];
    setMeals((prev) => [
      ...prev,
      { ...randomSample, id: Date.now().toString() },
    ]);
  };

  const handleClearMeals = () => {
    setMeals([]);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col pb-28 font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-zinc-300">
                {user?.name?.[0]?.toUpperCase() || "M"}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight text-white">
              {user?.name || "Member"}
            </h2>
            <p className="text-xs text-zinc-400">Asian Macro Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Camera photo analyzer opening...")}
            className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Meal</span>
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        
        {/* Camera Banner & Calorie Progress */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Photo Scan Action Banner */}
          <div className="md:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                Log Food via Photo
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Snap a picture of your meal for instant AI calorie & macro estimation.
              </p>
            </div>

            <button
              onClick={() => alert("Camera photo analyzer opening...")}
              className="mt-6 w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/10"
            >
              <Plus className="w-4 h-4" />
              <span>Snap Meal Photo</span>
            </button>
          </div>

          {/* Daily Calorie Summary */}
          <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                  Daily Budget Progress
                </h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-white">
                    {totalCalories.toLocaleString()}
                  </span>
                  <span className="text-sm text-zinc-400">
                    / {targetCalories.toLocaleString()} kcal
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {remainingCalories.toLocaleString()} kcal left
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Macro Breakdown Cards */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1 font-medium">
                  <Drumstick className="w-3.5 h-3.5 text-rose-400" />
                  <span>Protein</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {totalProtein}g / {proteinTarget}g
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1 font-medium">
                  <Wheat className="w-3.5 h-3.5 text-amber-400" />
                  <span>Carbs</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {totalCarbs}g / {carbsTarget}g
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1 font-medium">
                  <Droplet className="w-3.5 h-3.5 text-sky-400" />
                  <span>Fat</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {totalFat}g / {fatTarget}g
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Meal History Table / Log */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              <span>Today&apos;s Meals ({meals.length})</span>
            </h4>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSampleMeal}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Sample Meal</span>
              </button>

              {meals.length > 0 && (
                <button
                  onClick={handleClearMeals}
                  className="text-xs font-medium text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                  title="Clear All"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {meals.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Utensils className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-300">No meals logged today</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Tap &quot;Snap Meal Photo&quot; or &quot;Add Sample Meal&quot; to log your macros.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meal.emoji}</span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">
                        {meal.name}
                      </h5>
                      <p className="text-xs text-zinc-400">
                        {meal.type} • {meal.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">
                      {meal.calories} kcal
                    </span>
                    <p className="text-xs text-zinc-400">
                      P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Navigation Bar (Mathematically centered 3-column grid) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 h-16 w-full max-w-md mx-auto grid grid-cols-3 items-center">
        {/* Left Item */}
        <button className="flex flex-col items-center justify-center gap-1 text-emerald-400 font-semibold">
          <Utensils className="w-5 h-5" />
          <span className="text-[10px]">Log</span>
        </button>

        {/* Center Floating Camera Button */}
        <div className="flex items-center justify-center relative h-full">
          <button
            onClick={() => alert("Camera photo analyzer opening...")}
            className="absolute -top-5 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center border-4 border-zinc-950 shadow-xl active:scale-95 transition-transform"
            title="Scan Meal"
          >
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Right Item */}
        <button className="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </button>
      </nav>
    </div>
  );
}
