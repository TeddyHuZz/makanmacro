"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  Image as ImageIcon,
  Cloud,
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
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

  // Photo Source Action Sheet state
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  // Photo Analysis Modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [analyzedResult, setAnalyzedResult] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    emoji: string;
  } | null>(null);

  // Hidden File Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cloudInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    try {
      // Load user plan
      const savedPlanStr = localStorage.getItem("makanmacro_user_plan");
      if (savedPlanStr) {
        const plan = JSON.parse(savedPlanStr);
        if (plan.targetCalories) setTargetCalories(plan.targetCalories);
        if (plan.proteinGrams) setProteinTarget(plan.proteinGrams);
        if (plan.carbsGrams) setCarbsTarget(plan.carbsGrams);
        if (plan.fatGrams) setFatTarget(plan.fatGrams);
      } else {
        router.push("/onboarding");
      }

      // Load saved meals from local storage
      const savedMealsStr = localStorage.getItem("makanmacro_meals");
      if (savedMealsStr) {
        setMeals(JSON.parse(savedMealsStr));
      }
    } catch (e) {
      console.error("Failed to parse saved data", e);
    }
  }, [status, router]);

  // Save meals to local storage whenever updated
  const saveMealsToStorage = (updatedMeals: MealLog[]) => {
    setMeals(updatedMeals);
    try {
      localStorage.setItem("makanmacro_meals", JSON.stringify(updatedMeals));
    } catch (e) {
      console.error("Failed to save meals", e);
    }
  };

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

  // Handle file selection from camera/gallery/cloud with canvas compression for 95% faster AI scan
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoPickerOpen(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.65);
        setSelectedImage(compressedDataUrl);
        startAIAnalysis(compressedDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be chosen again if needed
    e.target.value = "";
  };

  // Call AI Vision Analysis route
  const startAIAnalysis = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalyzedResult(null);
    setAnalysisError("");
    setPortionMultiplier(1.0);

    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const json = await res.json();
      if (json?.success && json?.data) {
        setAnalyzedResult(json.data);
      } else {
        setAnalysisError(json?.error || "Failed to analyze image with AI.");
      }
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setAnalysisError("Failed to connect to AI server. Please check your network & API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAddMeal = () => {
    if (!analyzedResult) return;

    const newMeal: MealLog = {
      id: Date.now().toString(),
      name: analyzedResult.name,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "Meal Scan",
      calories: analyzedResult.calories,
      protein: analyzedResult.protein,
      carbs: analyzedResult.carbs,
      fat: analyzedResult.fat,
      emoji: analyzedResult.emoji,
      imageUrl: selectedImage || undefined,
    };

    saveMealsToStorage([...meals, newMeal]);
    setSelectedImage(null);
    setAnalyzedResult(null);
  };

  const handleDeleteMeal = (id: string) => {
    saveMealsToStorage(meals.filter((m) => m.id !== id));
  };

  const handleClearAllMeals = () => {
    saveMealsToStorage([]);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col pb-28 font-sans antialiased">
      
      {/* Hidden Native File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cloudInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

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
            <button
              onClick={() => router.push("/onboarding")}
              className="text-[11px] text-emerald-400 hover:underline font-medium"
            >
              TDEE Plan: {targetCalories.toLocaleString()} kcal (Edit)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhotoPickerOpen(true)}
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
              onClick={() => setIsPhotoPickerOpen(true)}
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

            {meals.length > 0 && (
              <button
                onClick={handleClearAllMeals}
                className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Clear All Meals"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {meals.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Utensils className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-300">No meals logged today</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Tap &quot;Snap Meal Photo&quot; to choose from Camera, Gallery, or Google Photos.
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
                    {meal.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-800"
                      />
                    ) : (
                      <span className="text-2xl">{meal.emoji}</span>
                    )}
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">
                        {meal.name}
                      </h5>
                      <p className="text-xs text-zinc-400">
                        {meal.type} • {meal.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-emerald-400">
                        {meal.calories} kcal
                      </span>
                      <p className="text-xs text-zinc-400">
                        P:{meal.protein}g • C:{meal.carbs}g • F:{meal.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Navigation Bar (Mathematically centered 3-column grid) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 h-16 w-full max-w-md mx-auto grid grid-cols-3 items-center">
        <button className="flex flex-col items-center justify-center gap-1 text-emerald-400 font-semibold">
          <Utensils className="w-5 h-5" />
          <span className="text-[10px]">Log</span>
        </button>

        <div className="flex items-center justify-center relative h-full">
          <button
            onClick={() => setIsPhotoPickerOpen(true)}
            className="absolute -top-5 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center border-4 border-zinc-950 shadow-xl active:scale-95 transition-transform"
            title="Scan Meal"
          >
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        <button className="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </button>
      </nav>

      {/* PHOTO SOURCE ACTION SHEET MODAL */}
      {isPhotoPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">Log Food Photo</h3>
                <p className="text-[11px] text-zinc-400">Choose photo source for AI analysis</p>
              </div>
              <button
                onClick={() => setIsPhotoPickerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Open Camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">1. Open Camera</h4>
                    <p className="text-[11px] text-zinc-400">Take a fresh photo of your meal</p>
                  </div>
                </div>
              </button>

              {/* Option 2: Open Gallery */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">2. Open Gallery</h4>
                    <p className="text-[11px] text-zinc-400">Choose image from device photos</p>
                  </div>
                </div>
              </button>

              {/* Option 3: Open Google Photos / Cloud */}
              <button
                onClick={() => cloudInputRef.current?.click()}
                className="w-full p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">3. Open Google Photos</h4>
                    <p className="text-[11px] text-zinc-400">Select from Google Photos / Cloud Drive</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI VISION PHOTO ANALYSIS MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            {/* Image Preview Container */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="Selected Food"
                className="w-full h-full object-cover"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                  <span className="text-xs font-bold text-white">AI Vision Scanning...</span>
                  <span className="text-[10px] text-emerald-400 mt-0.5">Detecting Asian food components</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {!isAnalyzing && analysisError && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <p className="font-semibold text-rose-400">Analysis Error</p>
                <p className="text-[11px] leading-relaxed">{analysisError}</p>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisError("");
                    setIsPhotoPickerOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-800"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Analysis Result */}
            {!isAnalyzing && analyzedResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Editable Dish Name & Calories */}
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analyzedResult.emoji}</span>
                    <input
                      type="text"
                      value={analyzedResult.name}
                      onChange={(e) =>
                        setAnalyzedResult({ ...analyzedResult, name: e.target.value })
                      }
                      className="w-full bg-transparent text-xs font-bold text-white border-b border-zinc-800 focus:border-emerald-500 focus:outline-none py-0.5"
                    />
                  </div>

                  {/* AI Vision Attribution & Open Food Facts DB Badge */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>
                        {(analyzedResult as any).source === "gemini-vision"
                          ? "Gemini AI Vision"
                          : "MakanMacro Vision"}
                        {(analyzedResult as any).openFoodFacts?.dbVerified
                          ? " • Open Food Facts DB"
                          : ""}
                      </span>
                    </span>
                    <span className="font-extrabold text-white">
                      {Math.round(analyzedResult.calories * portionMultiplier)} kcal
                    </span>
                  </div>
                </div>

                {/* Portion Adjuster */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5">
                    Portion Size
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0.5, 1.0, 1.5, 2.0].map((multiplier) => (
                      <button
                        key={multiplier}
                        type="button"
                        onClick={() => setPortionMultiplier(multiplier)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          portionMultiplier === multiplier
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {multiplier}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculated Macros based on portion */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Protein</span>
                    <p className="text-xs font-bold text-white">
                      {Math.round(analyzedResult.protein * portionMultiplier)}g
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Carbs</span>
                    <p className="text-xs font-bold text-white">
                      {Math.round(analyzedResult.carbs * portionMultiplier)}g
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Fat</span>
                    <p className="text-xs font-bold text-white">
                      {Math.round(analyzedResult.fat * portionMultiplier)}g
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalyzedResult(null);
                      setIsPhotoPickerOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>

                  <button
                    onClick={handleConfirmAddMeal}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Add Meal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
