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
  Scale,
  Search,
  Share2,
  Copy,
  Download,
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

  // MacroFactor Scale Weight & Trend state
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [scaleWeightInput, setScaleWeightInput] = useState("");
  const [currentWeight, setCurrentWeight] = useState<number | null>(72.5);

  // Quick Search & Custom Macro Log state
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [isSearchingFood, setIsSearchingFood] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    emoji: string;
    source: string;
  }[]>([]);
  const [customName, setCustomName] = useState("");
  const [customCals, setCustomCals] = useState("");
  const [customP, setCustomP] = useState("");
  const [customC, setCustomC] = useState("");
  const [customF, setCustomF] = useState("");

  // Social Share Story Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Photo Source Action Sheet state
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);

  // Photo Analysis Modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [cookingStyleMultiplier, setCookingStyleMultiplier] = useState<number>(1.0);
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

  // Live AI + Open Food Facts DB Text Search effect
  useEffect(() => {
    if (!quickQuery || quickQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearchingFood(false);
      return;
    }

    setIsSearchingFood(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/search-food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: quickQuery }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setSearchResults(data.results);
        }
      } catch (e) {
        console.error("Search fetch error", e);
      } finally {
        setIsSearchingFood(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [quickQuery]);


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

      // Load scale weight logs
      const savedWeightStr = localStorage.getItem("makanmacro_weight_logs");
      if (savedWeightStr) {
        const logs = JSON.parse(savedWeightStr);
        if (logs.length > 0) {
          setCurrentWeight(logs[logs.length - 1].weight);
        }
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

    const mult = portionMultiplier * cookingStyleMultiplier;
    const styleSuffix = cookingStyleMultiplier === 0.85 ? " (Less Oil)" : cookingStyleMultiplier === 1.15 ? " (Extra Oil/Gravy)" : "";

    const newMeal: MealLog = {
      id: Date.now().toString(),
      name: analyzedResult.name + styleSuffix,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "Meal Scan",
      calories: Math.round(analyzedResult.calories * mult),
      protein: Math.round(analyzedResult.protein * mult),
      carbs: Math.round(analyzedResult.carbs * mult),
      fat: Math.round(analyzedResult.fat * mult),
      emoji: analyzedResult.emoji,
      imageUrl: selectedImage || undefined,
    };

    saveMealsToStorage([...meals, newMeal]);
    setSelectedImage(null);
    setAnalyzedResult(null);
    setPortionMultiplier(1.0);
    setCookingStyleMultiplier(1.0);
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
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MakanMacro Logo"
              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shadow-md shadow-emerald-500/10"
            />
          </div>
          <div>
            <h2 className="text-sm font-extrabold leading-tight text-white flex items-center gap-1.5">
              <span>MakanMacro</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI</span>
            </h2>
            <button
              onClick={() => router.push("/onboarding")}
              className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors font-medium block truncate"
            >
              Target: {targetCalories.toLocaleString()} kcal (Edit)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
            title="Log Scale Weight"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentWeight ? `${currentWeight} kg` : "Log Weight"}</span>
          </button>

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
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">AI Vision Meal Scanner</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Snap or upload any Malaysian or Asian dish. Instantly detects calories, protein, carbs, & fat.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={() => setIsPhotoPickerOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-600/20"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Meal Photo</span>
              </button>

              <button
                onClick={() => setIsQuickSearchOpen(true)}
                className="w-full py-2.5 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Search / Custom Entry</span>
              </button>
            </div>
          </div>

          {/* Calorie & Target Progress Card */}
          <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Daily Target Budget</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {totalCalories} <span className="text-sm font-normal text-zinc-400">/ {targetCalories} kcal</span>
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-400 block">Remaining</span>
                <span className="text-lg sm:text-xl font-bold text-white">{remainingCalories} kcal</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>{Math.round(progressPercent)}% Budget Used</span>
                <span>{targetCalories - totalCalories >= 0 ? "Under Limit" : "Over Limit"}</span>
              </div>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1 font-medium">
                  <Drumstick className="w-3.5 h-3.5 text-emerald-400" />
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
                Tap &quot;Snap Meal Photo&quot; or &quot;Quick Search&quot; to log your first meal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 group flex flex-col gap-2.5"
                >
                  {/* Top Row: Thumbnail + Dish Name + Calorie Badge + Delete Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {meal.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={meal.imageUrl}
                          alt={meal.name}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                          {meal.emoji || "🍛"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                          {meal.name}
                        </h5>
                        <p className="text-[11px] text-zinc-400">
                          {meal.type} • {meal.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                        {meal.calories} kcal
                      </span>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Meal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Micro-Badges for Macros */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/50 text-[10px] font-semibold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      P: {meal.protein}g
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      C: {meal.carbs}g
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      F: {meal.fat}g
                    </span>
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

        <button
          onClick={() => router.push("/analytics")}
          className="flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-colors"
        >
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
                <h3 className="text-sm font-bold text-white">Log Food Item</h3>
                <p className="text-[11px] text-zinc-400">Choose photo source or quick search</p>
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

              {/* Option 3: Open Google Photos */}
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

              {/* Option 4: Quick Search / Custom Entry */}
              <button
                onClick={() => {
                  setIsPhotoPickerOpen(false);
                  setIsQuickSearchOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">4. Quick Search & Custom Log</h4>
                    <p className="text-[11px] text-zinc-400">Search drinks, snacks, or enter macros</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG SCALE WEIGHT MODAL */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Log Scale Weight</h3>
              </div>
              <button onClick={() => setIsWeightModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              MacroFactor uses daily scale entries to calculate your true TDEE energy expenditure curve.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Today&apos;s Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="72.5"
                value={scaleWeightInput}
                onChange={(e) => setScaleWeightInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(scaleWeightInput);
                  if (val > 0) {
                    setCurrentWeight(val);
                    try {
                      const logsStr = localStorage.getItem("makanmacro_weight_logs") || "[]";
                      const logs = JSON.parse(logsStr);
                      logs.push({ date: new Date().toISOString(), weight: val });
                      localStorage.setItem("makanmacro_weight_logs", JSON.stringify(logs));

                      // Automatically Recalculate TDEE & Update Daily Calorie Target
                      if (logs.length >= 2) {
                        const first = logs[0].weight;
                        const last = logs[logs.length - 1].weight;
                        const deltaKg = last - first;
                        const avgIntake = totalCalories > 0 ? totalCalories : targetCalories;
                        const calculatedTDEE = Math.round(avgIntake - (deltaKg * 7700 / Math.max(1, logs.length)));
                        
                        if (calculatedTDEE >= 1200 && calculatedTDEE <= 4500) {
                          const newCalTarget = Math.max(1200, calculatedTDEE - 350);
                          const newProtein = Math.round((newCalTarget * 0.3) / 4);
                          const newCarbs = Math.round((newCalTarget * 0.45) / 4);
                          const newFat = Math.round((newCalTarget * 0.25) / 9);

                          setTargetCalories(newCalTarget);
                          setProteinTarget(newProtein);
                          setCarbsTarget(newCarbs);
                          setFatTarget(newFat);

                          const updatedPlan = {
                            targetCalories: newCalTarget,
                            proteinGrams: newProtein,
                            carbsGrams: newCarbs,
                            fatGrams: newFat,
                          };
                          localStorage.setItem("makanmacro_user_plan", JSON.stringify(updatedPlan));
                        }
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  setIsWeightModalOpen(false);
                  setScaleWeightInput("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SEARCH & CUSTOM MACRO LOG MODAL */}
      {isQuickSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Smart Food & Drink Search</h3>
              </div>
              <button onClick={() => setIsQuickSearchOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Real-Time Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search food or drink (e.g., Teh C, Kopi, Roti...)"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            {/* Smart Database & Filter Results */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>{quickQuery ? "Matching Results" : "Popular Presets"}</span>
                <span className="text-amber-400 font-mono flex items-center gap-1">
                  {isSearchingFood ? (
                    <>
                      <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>AI Searching...</span>
                    </>
                  ) : (
                    <span>✨ AI + Asian DB</span>
                  )}
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {/* 1. Live AI & Open Food Facts Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {searchResults.map((item, idx) => (
                      <button
                        key={`sr-${idx}`}
                        onClick={() => {
                          const newMeal: MealLog = {
                            id: Date.now().toString(),
                            name: item.name,
                            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            type: "AI Quick Search",
                            calories: item.calories,
                            protein: item.protein,
                            carbs: item.carbs,
                            fat: item.fat,
                            emoji: item.emoji || "🥛",
                          };
                          saveMealsToStorage([...meals, newMeal]);
                          setIsQuickSearchOpen(false);
                          setQuickQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{item.emoji || "🍹"}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                            <span className="text-[9px] text-amber-400 font-semibold">{item.source || "✨ AI Estimate"}</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-400 shrink-0 ml-2">{item.calories} kcal</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Popular Presets Filter */}
                {[
                  { name: "Teh O Ais (Iced Black Tea)", calories: 85, protein: 0, carbs: 21, fat: 0, emoji: "🧊" },
                  { name: "Teh Tarik Kurang Manis", calories: 140, protein: 3, carbs: 22, fat: 4, emoji: "☕" },
                  { name: "Kopi O Kosong", calories: 15, protein: 0, carbs: 3, fat: 0, emoji: "☕" },
                  { name: "Teh C Peng Special", calories: 180, protein: 3, carbs: 32, fat: 5, emoji: "🧋" },
                  { name: "Sirap Bandung Ice", calories: 190, protein: 2, carbs: 38, fat: 4, emoji: "🥤" },
                  { name: "Milo Dinosaur", calories: 280, protein: 6, carbs: 48, fat: 8, emoji: "🥤" },
                  { name: "Curry Puff (1 pc)", calories: 240, protein: 4, carbs: 28, fat: 12, emoji: "🥟" },
                  { name: "Kuih Seri Muka (2 pcs)", calories: 160, protein: 2, carbs: 30, fat: 4, emoji: "🍡" },
                  { name: "Roti Canai Kosong", calories: 300, protein: 6, carbs: 46, fat: 10, emoji: "🫓" },
                  { name: "Soft Boiled Eggs (2 pcs)", calories: 140, protein: 12, carbs: 1, fat: 10, emoji: "🥚" },
                  { name: "Kaya Butter Toast", calories: 280, protein: 7, carbs: 34, fat: 13, emoji: "🍞" },
                  { name: "Fresh Sugar Cane Juice", calories: 130, protein: 0, carbs: 33, fat: 0, emoji: "🧃" },
                  { name: "Barley Ice Drink", calories: 110, protein: 1, carbs: 26, fat: 0, emoji: "🥛" },
                  { name: "Cendol Dessert", calories: 260, protein: 3, carbs: 42, fat: 9, emoji: "🍧" },
                  { name: "Siew Mai Dim Sum (3 pcs)", calories: 180, protein: 11, carbs: 14, fat: 8, emoji: "🥟" },
                ]
                  .filter((item) => item.name.toLowerCase().includes(quickQuery.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        const newMeal: MealLog = {
                          id: Date.now().toString(),
                          name: item.name,
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          type: "Quick Entry",
                          calories: item.calories,
                          protein: item.protein,
                          carbs: item.carbs,
                          fat: item.fat,
                          emoji: item.emoji,
                        };
                        saveMealsToStorage([...meals, newMeal]);
                        setIsQuickSearchOpen(false);
                        setQuickQuery("");
                        setSearchResults([]);
                      }}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-xs font-semibold text-white">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{item.calories} kcal</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom Macro Entry Form */}
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom Macro Entry</span>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Food Name (e.g. Protein Shake)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Calories (kcal)"
                    value={customCals}
                    onChange={(e) => setCustomCals(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
                  />
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={customP}
                    onChange={(e) => setCustomP(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
                  />
                  <input
                    type="number"
                    placeholder="Carbs (g)"
                    value={customC}
                    onChange={(e) => setCustomC(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
                  />
                  <input
                    type="number"
                    placeholder="Fat (g)"
                    value={customF}
                    onChange={(e) => setCustomF(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (customName && customCals) {
                    const newMeal: MealLog = {
                      id: Date.now().toString(),
                      name: customName,
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      type: "Custom Log",
                      calories: parseInt(customCals) || 0,
                      protein: parseInt(customP) || 0,
                      carbs: parseInt(customC) || 0,
                      fat: parseInt(customF) || 0,
                      emoji: "📝",
                    };
                    saveMealsToStorage([...meals, newMeal]);
                    setIsQuickSearchOpen(false);
                    setCustomName("");
                    setCustomCals("");
                    setCustomP("");
                    setCustomC("");
                    setCustomF("");
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20"
              >
                Log Custom Meal
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
                      {Math.round(analyzedResult.calories * portionMultiplier * cookingStyleMultiplier)} kcal
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

                {/* Hawker Preparation Style Adjuster (Human-Grade UI/UX) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                      Hawker Preparation & Oil Style
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-400">
                      {cookingStyleMultiplier === 0.85 ? "-15% Oil Cut" : cookingStyleMultiplier === 1.15 ? "+15% Extra Gravy" : "Standard Hawker"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "less-oil",
                        label: "Less Oil",
                        sub: "Kurang Minyak",
                        val: 0.85,
                        icon: Droplet,
                        activeStyle: "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10",
                      },
                      {
                        id: "biasa",
                        label: "Biasa",
                        sub: "Standard Stall",
                        val: 1.0,
                        icon: Utensils,
                        activeStyle: "bg-zinc-800 border-zinc-600 text-white shadow-lg",
                      },
                      {
                        id: "extra-gravy",
                        label: "Extra Gravy",
                        sub: "Tambah Sambal",
                        val: 1.15,
                        icon: Flame,
                        activeStyle: "bg-rose-500/15 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10",
                      },
                    ].map((prep) => {
                      const IconComp = prep.icon;
                      const isSelected = cookingStyleMultiplier === prep.val;
                      return (
                        <button
                          key={prep.id}
                          type="button"
                          onClick={() => setCookingStyleMultiplier(prep.val)}
                          className={`py-2 px-2 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 ${
                            isSelected
                              ? prep.activeStyle
                              : "bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                          }`}
                        >
                          <IconComp className={`w-3.5 h-3.5 mb-1 ${isSelected ? "" : "opacity-60"}`} />
                          <span className="text-xs font-bold block leading-tight">{prep.label}</span>
                          <span className="text-[9px] text-zinc-400 font-medium mt-0.5">{prep.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculated Macros based on portion & style */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Protein</span>
                    <p className="text-xs font-bold text-white">
                      {Math.round(analyzedResult.protein * portionMultiplier * cookingStyleMultiplier)}g
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Carbs</span>
                    <p className="text-xs font-bold text-white">
                      {Math.round(analyzedResult.carbs * portionMultiplier * cookingStyleMultiplier)}g
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium">Fat</span>
                    <p className="text-xs font-bold text-white">
                      {Math.round(analyzedResult.fat * portionMultiplier * cookingStyleMultiplier)}g
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

      {/* SOCIAL SHARE DAILY RECAP STORY MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Daily Macro Recap</h3>
                  <p className="text-[10px] text-zinc-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                </div>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Story Card Preview */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
              {/* Calorie Stats */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Consumed</span>
                  <p className="text-xl font-black text-white">{totalCalories} <span className="text-xs font-normal text-zinc-400">/ {targetCalories} kcal</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-xs">
                  {Math.round(progressPercent)}%
                </div>
              </div>

              {/* Macro Pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <p className="text-emerald-400 font-bold">{totalProtein}g</p>
                  <p className="text-zinc-400 font-medium">Protein</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <p className="text-amber-400 font-bold">{totalCarbs}g</p>
                  <p className="text-zinc-400 font-medium">Carbs</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  <p className="text-sky-400 font-bold">{totalFat}g</p>
                  <p className="text-zinc-400 font-medium">Fat</p>
                </div>
              </div>

              {/* Today's Meals Quick List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Log Highlights</span>
                {meals.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-950 border border-zinc-800/60">
                    <span className="text-zinc-200 font-medium truncate max-w-45">{m.emoji} {m.name}</span>
                    <span className="text-emerald-400 font-bold">{m.calories} kcal</span>
                  </div>
                ))}
              </div>

              {/* MakanMacro AI Watermark */}
              <div className="pt-2 flex items-center justify-between text-[9px] text-zinc-500 border-t border-zinc-800/60">
                <span className="font-semibold text-zinc-400">MakanMacro Asian AI Tracker</span>
                <span>makanmacro.com</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const summaryText = `🔥 My MakanMacro Recap (${new Date().toLocaleDateString()})\n\nTotal Calories: ${totalCalories} / ${targetCalories} kcal\n🥩 Protein: ${totalProtein}g\n🌾 Carbs: ${totalCarbs}g\n🥑 Fat: ${totalFat}g\n\nMeals Logged:\n${meals.map(m => `• ${m.emoji} ${m.name} (${m.calories} kcal)`).join("\n")}\n\nTracked with MakanMacro AI!`;
                  navigator.clipboard.writeText(summaryText);
                  alert("🎉 Daily Macro Summary copied to clipboard! Ready to paste on WhatsApp / Instagram Story.");
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Summary Text</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
