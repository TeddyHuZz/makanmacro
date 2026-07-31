"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export default function TermsPage() {
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
                Terms of Service
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
            <FileText className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            By accessing or using MakanMacro (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-lg font-bold text-white">2. Nutritional & Medical Disclaimer</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            MakanMacro provides automated AI estimations for caloric and macronutrient values of food items. These estimations are for general nutritional guidance and informational purposes only.
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-zinc-400 space-y-1.5 pt-1">
            <li>MakanMacro is not a medical device or certified clinical dietitian provider.</li>
            <li>Always consult a qualified physician or nutritionist before starting any strict dietary regimen.</li>
            <li>Actual hawker portion sizes, oil contents, and sodium levels may vary by stall.</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">3. User Accounts & Data Responsibilities</h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">4. Acceptable Use Policy</h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            You agree not to misuse the Service, attempt unauthorized access to API endpoints, or submit malicious data. We reserve the right to suspend or terminate accounts that violate system integrity.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">5. Changes to Terms</h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            We reserve the right to modify these Terms at any time. Continued use of MakanMacro after updates constitutes your acceptance of the revised Terms.
          </p>
        </div>

        <div className="text-center text-xs text-zinc-500 pt-4">
          Questions about our Terms? Contact us at <span className="text-emerald-400">swenfei04@gmail.com</span>
        </div>
      </main>
    </div>
  );
}
