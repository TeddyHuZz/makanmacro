"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Database, Eye } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-white pb-16">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all shrink-0 active:scale-95"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MakanMacro Logo"
              className="w-8 h-8 rounded-xl object-cover border border-emerald-500/30 shadow-md shadow-emerald-500/10"
            />
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                Privacy Policy
              </h1>
              <p className="text-[10px] text-zinc-400">Effective Date: July 31, 2026</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <Lock className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            MakanMacro collects information necessary to personalize your nutrition tracking:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-zinc-400 space-y-1.5 pt-1">
            <li><strong>Account Data:</strong> Email address and name provided during sign-up or Google OAuth authentication.</li>
            <li><strong>Biometric Preferences:</strong> Age, weight, height, activity level, and calorie target profile.</li>
            <li><strong>Meal Image Scans:</strong> Photos submitted for AI food analysis.</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 text-purple-400">
            <Eye className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">2. AI Vision & Data Processing</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            When you scan a meal photo, the image is securely transmitted via encrypted HTTPS to Google Gemini AI API solely to generate nutritional estimates.
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-zinc-400 space-y-1.5 pt-1">
            <li>Food images are processed statelessly and are not used to train public AI models.</li>
            <li>Client-side canvas compression reduces image payloads by up to 95% before transmission for maximum speed and privacy.</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <Database className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">3. Local Storage & Data Ownership</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Your daily meal logs and scale weight history are stored securely in your web browser&apos;s <code className="text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded">localStorage</code>.
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 pt-1">
            You retain 100% ownership of your data and can export all your records at any time using the <strong>Export CSV</strong> feature on the Analytics page.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">4. Your Data Rights & Deletion</h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            You have the right to erase all your saved meals and scale logs at any time by tapping the &quot;Clear All&quot; button in your dashboard or clearing your browser storage.
          </p>
        </div>

        <div className="text-center text-xs text-zinc-500 pt-4">
          Privacy concerns? Reach out to our team at <span className="text-emerald-400">privacy@makanmacro.com</span>
        </div>
      </main>
    </div>
  );
}
