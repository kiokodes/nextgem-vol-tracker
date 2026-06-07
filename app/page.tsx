import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gem-green flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #C9973A 1px, transparent 1px),
                           radial-gradient(circle at 80% 20%, #C9973A 1px, transparent 1px),
                           radial-gradient(circle at 60% 80%, #C9973A 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo mark */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gem-gold flex items-center justify-center shadow-2xl">
            <span className="text-4xl">💎</span>
          </div>
        </div>

        <h1
          className="font-display text-5xl font-semibold text-gem-cream mb-3 leading-tight"
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          NextGem Foundation
        </h1>
        <p className="text-gem-gold text-lg mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
          A future for every orphan.
        </p>
        <p
          className="text-gem-cream/60 text-sm mb-12"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Volunteer Hour Tracking Platform
        </p>

        <div className="flex flex-col gap-3">
          <p className="text-gem-cream/40 text-xs uppercase tracking-widest">
            Scan a QR code at your orphanage to check in
          </p>
          <Link
            href="/dashboard"
            className="mt-4 text-gem-gold/60 text-sm underline underline-offset-4 hover:text-gem-gold transition-colors"
          >
            Admin Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
