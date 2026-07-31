"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Flame,
  Utensils,
  Check,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMsg("");
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: unknown) {
      console.error("Google OAuth error:", err);
      setErrorMsg("Google Sign-In requires Client ID configuration in .env.local");
      setIsGoogleLoading(false);
    }
  };

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setErrorMsg(res.error || "Authentication failed. Check your credentials.");
        setIsLoading(false);
      } else {
        setSuccessMsg(
          mode === "signup"
            ? "Account created! Setting up your TDEE plan..."
            : "Welcome back! Redirecting..."
        );
        setTimeout(() => {
          const existingPlan = localStorage.getItem("makanmacro_user_plan");
          if (existingPlan) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-12 font-sans antialiased">
      {/* Container wrapper - scales smoothly from mobile single-column to desktop split-screen */}
      <div className="w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side Showcase (Visible on Laptop / Desktop screens, concise on mobile) */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 lg:pr-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MakanMacro Logo"
              className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Makan<span className="text-emerald-500">Macro</span>
              </h1>
              <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full mt-0.5">
                Asian & Malaysian Cuisine AI
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Snap your meal. <br />
              <span className="text-zinc-400 font-normal">Know your macros in seconds.</span>
            </h2>
          </div>

          {/* Desktop Product Showcase Preview Card */}
          <div className="hidden sm:block p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl">
                  🍛
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nasi Lemak Special</h3>
                  <p className="text-xs text-zinc-400">AI Vision Match • 98% Accuracy</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                644 kcal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Protein</span>
                <p className="text-xs font-bold text-white mt-0.5">28g</p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Carbs</span>
                <p className="text-xs font-bold text-white mt-0.5">68g</p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Fat</span>
                <p className="text-xs font-bold text-white mt-0.5">28g</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col space-y-2.5 text-xs text-zinc-400 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>No manual searching — AI vision detects local hawker dishes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>PWA supported — install directly on iOS & Android home screens</span>
            </div>
          </div>
        </div>

        {/* Right Side Form (Mobile-first responsive card, enlarged & desktop friendly) */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Segmented Mode Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-zinc-950 rounded-2xl mb-6 border border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  mode === "signin"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  mode === "signup"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-12 rounded-2xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/60 text-zinc-100 font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <span className="relative px-3 text-xs text-zinc-500 bg-zinc-900 uppercase tracking-wider font-semibold">
                Or with email
              </span>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleCredentialsAuth} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ahmad Razali"
                      className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() =>
                        setErrorMsg("Password reset is available via email setup.")
                      }
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] disabled:opacity-60 mt-2 shadow-lg shadow-emerald-600/10"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{mode === "signin" ? "Sign In to MakanMacro" : "Create Account"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6">
        <p className="text-xs text-zinc-600">
          MakanMacro
        </p>
      </footer>
    </div>
  );
}
