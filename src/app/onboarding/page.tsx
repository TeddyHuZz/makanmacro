"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");

  // Step 1: User Profile (Initial empty strings so placeholders display greyed out)
  const [gender, setGender] = useState<"male" | "female">("male");
  const [ageInput, setAgeInput] = useState<string>("");
  const [heightInput, setHeightInput] = useState<string>("");
  const [weightInput, setWeightInput] = useState<string>("");

  // Step 2: Activity Level
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active">("moderate");

  // Step 3: Primary Goal
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">("lose");

  // Calculated Results
  const [calculatedPlan, setCalculatedPlan] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    weightKg: number;
    heightCm: number;
    age: number;
  } | null>(null);

  const [hasExistingPlan, setHasExistingPlan] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    try {
      const savedPlan = localStorage.getItem("makanmacro_user_plan");
      if (savedPlan) {
        setHasExistingPlan(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [status, router]);

  // Validate step 1 numbers
  const validateStep1 = () => {
    setStepError("");

    const ageNum = parseInt(ageInput, 10);
    const heightNum = parseFloat(heightInput);
    const weightNum = parseFloat(weightInput);

    if (!ageInput.trim() || isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      setStepError("Please enter a valid age between 10 and 120.");
      return false;
    }
    if (!heightInput.trim() || isNaN(heightNum) || heightNum < 80 || heightNum > 250) {
      setStepError("Please enter a valid height in cm (80 - 250 cm).");
      return false;
    }
    if (!weightInput.trim() || isNaN(weightNum) || weightNum < 25 || weightNum > 300) {
      setStepError("Please enter a valid weight in kg (25 - 300 kg).");
      return false;
    }

    return { ageNum, heightNum, weightNum };
  };

  // Mifflin-St Jeor TDEE Calculation
  const calculatePlan = () => {
    const valid = validateStep1();
    if (!valid) return;

    const { ageNum, heightNum, weightNum } = valid;

    let bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum;
    bmr = gender === "male" ? bmr + 5 : bmr - 161;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };

    const tdee = Math.round(bmr * activityMultipliers[activity]);

    let targetCalories = tdee;
    if (goal === "lose") targetCalories = Math.round(tdee - 500);
    if (goal === "gain") targetCalories = Math.round(tdee + 300);

    // Macro Split (Protein 2.0g/kg, Fat ~25% calories, Carbs remainder)
    const proteinGrams = Math.round(weightNum * 2.0);
    const fatGrams = Math.round((targetCalories * 0.25) / 9);
    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const carbsGrams = Math.max(50, Math.round((targetCalories - proteinCalories - fatCalories) / 4));

    const plan = {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      weightKg: weightNum,
      heightCm: heightNum,
      age: ageNum,
    };

    setCalculatedPlan(plan);
  };

  const handleNext = () => {
    setStepError("");
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      const valid = validateStep1();
      if (!valid) {
        setStep(1);
        return;
      }
      calculatePlan();
      setStep(4);
    }
  };

  const handleBack = () => {
    setStepError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinishOnboarding = () => {
    if (calculatedPlan) {
      const userPlanData = {
        ...calculatedPlan,
        gender,
        goal,
        activity,
        completedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem("makanmacro_user_plan", JSON.stringify(userPlanData));
      } catch (e) {
        console.error("Failed to save plan to localStorage", e);
      }
    }
    router.push("/dashboard");
  };

  // Helper to sanitize numerical input typing (strips non-digits except single decimal for weight)
  const handleNumberInput = (
    val: string,
    setter: (v: string) => void,
    allowDecimal = false
  ) => {
    if (val === "") {
      setter("");
      return;
    }

    // Replace leading zero if typing new digits e.g. "0158" -> "158"
    let cleaned = val;
    if (cleaned.length > 1 && cleaned.startsWith("0") && !cleaned.startsWith("0.")) {
      cleaned = cleaned.replace(/^0+/, "");
    }

    if (allowDecimal) {
      if (/^\d*\.?\d*$/.test(cleaned)) {
        setter(cleaned);
      }
    } else {
      if (/^\d*$/.test(cleaned)) {
        setter(cleaned);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col justify-between items-center p-4 sm:p-6 font-sans antialiased select-none">
      
      {/* Top Header */}
      <header className="w-full max-w-md pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="MakanMacro Logo"
            className="w-9 h-9 rounded-xl object-cover border border-emerald-500/30 shadow-md shadow-emerald-500/10"
          />
          <span className="text-lg font-extrabold text-white tracking-tight">
            Makan<span className="text-emerald-500">Macro</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasExistingPlan && (
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              Skip to Dashboard
            </button>
          )}

          {step > 1 && (
            <button
              onClick={handleBack}
              className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Wizard Card */}
      <main className="w-full max-w-md my-auto">
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span>STEP {step} OF 4</span>
              <span>
                {step === 1 && "Basic Body Metrics"}
                {step === 2 && "Activity Level"}
                {step === 3 && "Primary Goal"}
                {step === 4 && "Your Custom Plan"}
              </span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Validation Error Banner */}
          {stepError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 1: Body Metrics */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Let&apos;s calculate your TDEE
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  We need a few details to personalize your daily calorie & macro budget.
                </p>
              </div>

              {/* Gender Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      gender === "male"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    👨 Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      gender === "female"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    👩 Female
                  </button>
                </div>
              </div>

              {/* Numerical Inputs (Allows natural clearing & type-over) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Age (yrs)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ageInput}
                    onChange={(e) => handleNumberInput(e.target.value, setAgeInput)}
                    placeholder="25"
                    className="w-full h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-bold text-center text-sm placeholder:text-zinc-600 placeholder:font-normal focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={heightInput}
                    onChange={(e) => handleNumberInput(e.target.value, setHeightInput)}
                    placeholder="170"
                    className="w-full h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-bold text-center text-sm placeholder:text-zinc-600 placeholder:font-normal focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weightInput}
                    onChange={(e) => handleNumberInput(e.target.value, setWeightInput, true)}
                    placeholder="60"
                    className="w-full h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-bold text-center text-sm placeholder:text-zinc-600 placeholder:font-normal focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Activity Level */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Daily Activity Level
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  How active are you on an average weekday?
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: "sedentary",
                    title: "Sedentary",
                    desc: "Desk job, little to no exercise",
                    icon: "💻",
                  },
                  {
                    id: "light",
                    title: "Lightly Active",
                    desc: "Light exercise / sports 1-3 days/wk",
                    icon: "🚶‍♂️",
                  },
                  {
                    id: "moderate",
                    title: "Moderately Active",
                    desc: "Moderate exercise / sports 3-5 days/wk",
                    icon: "🏃‍♂️",
                  },
                  {
                    id: "active",
                    title: "Very Active",
                    desc: "Hard exercise 6-7 days a week",
                    icon: "🏋️‍♂️",
                  },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setActivity(act.id as any)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      activity === act.id
                        ? "bg-emerald-500/10 border-emerald-500 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{act.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{act.title}</h4>
                        <p className="text-[11px] text-zinc-400">{act.desc}</p>
                      </div>
                    </div>
                    {activity === act.id && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Goals */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  What is your primary goal?
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  MakanMacro will tune your calories to hit your specific weight target.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: "lose",
                    title: "Weight Loss (Deficit)",
                    desc: "Burn fat with a sustainable ~500 kcal deficit",
                    icon: "🔥",
                  },
                  {
                    id: "maintain",
                    title: "Maintain Weight",
                    desc: "Stay healthy and track daily Asian hawker macros",
                    icon: "⚖️",
                  },
                  {
                    id: "gain",
                    title: "Build Muscle / Gain",
                    desc: "Controlled surplus (~300 kcal) for lean gains",
                    icon: "💪",
                  },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id as any)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      goal === g.id
                        ? "bg-emerald-500/10 border-emerald-500 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{g.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{g.title}</h4>
                        <p className="text-[11px] text-zinc-400">{g.desc}</p>
                      </div>
                    </div>
                    {goal === g.id && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Custom Calculated Plan Summary */}
          {step === 4 && calculatedPlan && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 stroke-2" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Your Custom Nutrition Plan
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calculated based on Mifflin-St Jeor TDEE formula
                </p>
              </div>

              {/* Main Target Banner */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Target Daily Calorie Budget
                </span>
                <div className="text-3xl font-black text-white">
                  {calculatedPlan.targetCalories.toLocaleString()} <span className="text-xs font-normal text-zinc-400">kcal/day</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Maintenance TDEE: {calculatedPlan.tdee} kcal
                </p>
              </div>

              {/* Macro Targets */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Protein</span>
                  <p className="text-sm font-extrabold text-white mt-1">
                    {calculatedPlan.proteinGrams}g
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Carbs</span>
                  <p className="text-sm font-extrabold text-white mt-1">
                    {calculatedPlan.carbsGrams}g
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-bold text-sky-400 uppercase">Fat</span>
                  <p className="text-sm font-extrabold text-white mt-1">
                    {calculatedPlan.fatGrams}g
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <span>{step === 3 ? "Calculate My Plan" : "Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <span>Save Plan & Start Tracking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-4">
        <p className="text-[11px] text-zinc-600">
          MakanMacro • Personalized Asian Macro Science
        </p>
      </footer>
    </div>
  );
}
