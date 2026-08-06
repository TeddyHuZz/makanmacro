"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Utensils,
  Camera,
  ArrowLeft,
  Target,
  Flame,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  Download,
  Scale,
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
  imageUrl?: string;
  createdAt?: string;
  date?: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [meals, setMeals] = useState<MealLog[]>([]);
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [proteinTarget, setProteinTarget] = useState<number>(130);
  const [carbsTarget, setCarbsTarget] = useState<number>(220);
  const [fatTarget, setFatTarget] = useState<number>(65);

  // MacroFactor Scale Weight & Trend state
  const [currentWeight, setCurrentWeight] = useState<number | null>(72.5);

  // MacroFactor Weekly Check-in Locking state
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    try {
      // Instant load from localStorage
      const savedPlanStr = localStorage.getItem("makanmacro_user_plan");
      if (savedPlanStr) {
        const plan = JSON.parse(savedPlanStr);
        if (plan.targetCalories) setTargetCalories(plan.targetCalories);
        if (plan.proteinGrams) setProteinTarget(plan.proteinGrams);
        if (plan.carbsGrams) setCarbsTarget(plan.carbsGrams);
        if (plan.fatGrams) setFatTarget(plan.fatGrams);
      }

      const savedMealsStr = localStorage.getItem("makanmacro_meals");
      if (savedMealsStr) {
        setMeals(JSON.parse(savedMealsStr));
      }

      const logsStr = localStorage.getItem("makanmacro_weight_logs");
      if (logsStr) {
        const logs = JSON.parse(logsStr);
        if (logs.length > 0) {
          setCurrentWeight(logs[logs.length - 1].weight);
        }
      }

      const savedCheckIn = localStorage.getItem("makanmacro_last_checkin");
      if (savedCheckIn) {
        setLastCheckIn(savedCheckIn);
      }

      // Background fetch from Neon DB
      (async () => {
        try {
          const [planRes, mealsRes, weightsRes] = await Promise.all([
            fetch("/api/plan").then((r) => r.json()).catch(() => null),
            fetch("/api/meals").then((r) => r.json()).catch(() => null),
            fetch("/api/weights").then((r) => r.json()).catch(() => null),
          ]);

          if (planRes?.success && planRes.plan) {
            const p = planRes.plan;
            setTargetCalories(p.targetCalories);
            setProteinTarget(p.proteinGrams);
            setCarbsTarget(p.carbsGrams);
            setFatTarget(p.fatGrams);
          }

          if (mealsRes?.success && Array.isArray(mealsRes.meals)) {
            setMeals(mealsRes.meals);
            localStorage.setItem("makanmacro_meals", JSON.stringify(mealsRes.meals));
          }

          if (weightsRes?.success && Array.isArray(weightsRes.weights) && weightsRes.weights.length > 0) {
            setCurrentWeight(weightsRes.weights[weightsRes.weights.length - 1].weight);
          }
        } catch (err) {
          console.error("Neon DB sync error", err);
        }
      })();
    } catch (e) {
      console.error("Failed to load analytics data", e);
    }
  }, [status, router]);

  const handleExportCSV = () => {
    try {
      const savedMeals = localStorage.getItem("makanmacro_meals") || "[]";
      const savedWeights = localStorage.getItem("makanmacro_weight_logs") || "[]";
      const mealsData = JSON.parse(savedMeals);
      const weightsData = JSON.parse(savedWeights);

      let csvContent = "data:text/csv;charset=utf-8,Type,Date/Time,Name/Weight,Calories,Protein(g),Carbs(g),Fat(g)\n";

      mealsData.forEach((m: any) => {
        csvContent += `Meal,"${m.time || ''}","${m.name || ''}",${m.calories || 0},${m.protein || 0},${m.carbs || 0},${m.fat || 0}\n`;
      });

      weightsData.forEach((w: any) => {
        csvContent += `WeightLog,"${w.date || ''}",${w.weight} kg,0,0,0,0\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `makanmacro_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Failed to generate CSV export.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-emerald-500 animate-pulse" />
        </div>
        <p className="mt-3 text-xs text-zinc-500 font-medium">Loading Analytics...</p>
      </div>
    );
  }

  // Helper to extract Date object from a MealLog
  const getMealDate = (meal: MealLog): Date => {
    if (meal.createdAt) return new Date(meal.createdAt);
    if (meal.date) return new Date(meal.date);
    if (meal.id && !isNaN(Number(meal.id))) return new Date(Number(meal.id));
    return new Date();
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Filter today's meals
  const today = new Date();
  const todayMeals = meals.filter((m) => isSameDay(getMealDate(m), today));

  // Today's total intake
  const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const todayProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const todayCarbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
  const todayFat = todayMeals.reduce((acc, m) => acc + m.fat, 0);

  // Highest protein meal (prefer today's meals, fallback to all-time if today has none)
  const topProteinMeal = todayMeals.length > 0
    ? [...todayMeals].sort((a, b) => b.protein - a.protein)[0]
    : meals.length > 0
    ? [...meals].sort((a, b) => b.protein - a.protein)[0]
    : null;

  // Real 7-day data (current week Monday to Sunday)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  const weeklyData = daysOfWeek.map((day, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    const dayMeals = meals.filter((m) => isSameDay(getMealDate(m), dayDate));
    const dayCalories = dayMeals.reduce((acc, m) => acc + m.calories, 0);
    const isToday = isSameDay(dayDate, today);

    return { day, calories: dayCalories, isToday };
  });

  const adherenceScore = todayCalories > 0
    ? Math.max(70, Math.min(99, Math.round(100 - Math.abs(todayCalories - targetCalories) / 50)))
    : (meals.length > 0 ? 94 : 100);

  // Dynamic MacroFactor TDEE Expenditure Calculation
  const estimatedExpenditure = (() => {
    try {
      const weightLogsStr = localStorage.getItem("makanmacro_weight_logs");
      const weightLogs = weightLogsStr ? JSON.parse(weightLogsStr) : [];

      if (weightLogs.length >= 2) {
        const first = weightLogs[0].weight;
        const last = weightLogs[weightLogs.length - 1].weight;
        const deltaKg = last - first;
        const avgDailyIntake = todayCalories > 0 ? todayCalories : targetCalories;
        const calculatedTDEE = Math.round(avgDailyIntake - (deltaKg * 7700 / Math.max(1, weightLogs.length)));
        if (calculatedTDEE >= 1200 && calculatedTDEE <= 4500) {
          return calculatedTDEE;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return targetCalories > 0 ? targetCalories + 300 : 2150;
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation (Ultra-Compact & Clean Mobile Design) */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        {/* Left: Compact Logo + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="MakanMacro Logo"
            className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold leading-none text-white truncate">
              Analytics
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">Macro Engine</p>
          </div>
        </div>

        {/* Right: Compact Action Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 h-7 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold transition-all active:scale-95"
            title="Export meal & weight history as CSV"
          >
            <Download className="w-3 h-3 text-purple-400" />
            <span>CSV</span>
          </button>

          <div
            className="flex items-center gap-1 h-7 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold"
            title="Calorie Target Adherence Score"
          >
            <Award className="w-3 h-3" />
            <span>{adherenceScore}% Match</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md lg:max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Weekly Calorie Trends Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">7-Day Calorie Trend</h3>
                <p className="text-[10px] text-zinc-400">Target Budget: {targetCalories} kcal</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>On Track</span>
            </span>
          </div>

          {/* 7-Day Bar Chart */}
          <div className="pt-2">
            <div className="h-36 flex items-end justify-between gap-2 border-b border-zinc-800 pb-2">
              {weeklyData.map((item) => {
                const heightPercent = Math.min(100, (item.calories / (targetCalories * 1.2)) * 100);
                const isOver = item.calories > targetCalories;

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap z-10 pointer-events-none">
                      {item.calories} kcal
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(12, heightPercent)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        item.isToday
                          ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                          : isOver
                          ? "bg-amber-500/80"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    />

                    {/* Day Label */}
                    <span
                      className={`text-[10px] font-semibold ${
                        item.isToday ? "text-emerald-400 font-bold" : "text-zinc-500"
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Macro Ratio Distribution & Target Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Protein */}
          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protein Ratio</span>
              </span>
              <span className="font-bold text-emerald-400">
                {Math.round((todayProtein / (proteinTarget || 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (todayProtein / (proteinTarget || 1)) * 100)}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Intake: {todayProtein}g</span>
              <span>Goal: {proteinTarget}g</span>
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Carbs Ratio</span>
              </span>
              <span className="font-bold text-amber-400">
                {Math.round((todayCarbs / (carbsTarget || 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (todayCarbs / (carbsTarget || 1)) * 100)}%` }}
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Intake: {todayCarbs}g</span>
              <span>Goal: {carbsTarget}g</span>
            </div>
          </div>

          {/* Fat */}
          <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                <span>Fat Ratio</span>
              </span>
              <span className="font-bold text-sky-400">
                {Math.round((todayFat / (fatTarget || 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (todayFat / (fatTarget || 1)) * 100)}%` }}
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Intake: {todayFat}g</span>
              <span>Goal: {fatTarget}g</span>
            </div>
          </div>
        </div>

        {/* High-Performance Macro Insights */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Key Macro Insights
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400">Top Protein Meal</p>
                <p className="text-xs font-bold text-white truncate">
                  {topProteinMeal ? `${topProteinMeal.name} (${topProteinMeal.protein}g)` : "No meals logged"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400">Average Meal Size</p>
                <p className="text-xs font-bold text-white">
                  {todayMeals.length > 0
                    ? `${Math.round(todayCalories / todayMeals.length)} kcal / meal`
                    : meals.length > 0
                    ? `${Math.round(meals.reduce((a, m) => a + m.calories, 0) / meals.length)} kcal / meal`
                    : "0 kcal"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live TDEE & Expenditure Engine Card (Human-Grade UI/UX) */}
        <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 relative overflow-hidden">
          {/* Header Row: Title & Single-Line Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">Expenditure Engine</h4>
                <p className="text-[10px] text-zinc-400">MacroFactor Auto-Sync</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-Sync</span>
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Expenditure</span>
              </span>
              <p className="text-sm sm:text-base font-extrabold text-white">
                {estimatedExpenditure.toLocaleString()} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" />
                <span>Daily Target</span>
              </span>
              <p className="text-sm sm:text-base font-extrabold text-emerald-400">
                {targetCalories.toLocaleString()} <span className="text-[10px] font-normal text-zinc-400">kcal</span>
              </p>
            </div>
          </div>

          {/* Visual Energy Deficit Gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
              <span>Target Deficit Gap</span>
              <span className="text-emerald-400">
                -{estimatedExpenditure - targetCalories > 0 ? estimatedExpenditure - targetCalories : 350} kcal deficit
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (targetCalories / estimatedExpenditure) * 100)}%` }}
                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full"
              />
            </div>
          </div>

          {/* Subtle Micro Footnote */}
          <p className="text-[10px] text-zinc-500 text-center font-medium pt-1">
            Calorie budget auto-updates live whenever scale weight is logged
          </p>
        </div>
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 h-16 w-full max-w-md mx-auto grid grid-cols-3 items-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-colors"
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px]">Log</span>
        </button>

        <div className="flex items-center justify-center relative h-full">
          <button
            onClick={() => router.push("/dashboard")}
            className="absolute -top-5 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center border-4 border-zinc-950 shadow-xl active:scale-95 transition-transform"
            title="Scan Meal"
          >
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        <button className="flex flex-col items-center justify-center gap-1 text-emerald-400 font-semibold">
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </button>
      </nav>
    </div>
  );
}
