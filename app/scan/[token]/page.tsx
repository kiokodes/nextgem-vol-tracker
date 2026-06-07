"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Orphanage = { id: string; name: string; qr_code_token: string };
type Volunteer = { id: string; name: string; nysc_code: string; orphanage_id: string };
type Session = {
  id: string;
  volunteer_id: string;
  check_in_time: string;
  check_out_time: string | null;
  date: string;
  hours: number | null;
};

type Stage =
  | "loading"
  | "error"
  | "select"
  | "confirming"
  | "checkin-success"
  | "checkout-success";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function calcHours(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return (ms / 1000 / 60 / 60).toFixed(2);
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export default function ScanPage({ params }: { params: { token: string } }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [orphanage, setOrphanage] = useState<Orphanage | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [completedSession, setCompletedSession] = useState<Session | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      // Find orphanage by token
      const { data: orph, error: orphErr } = await supabase
        .from("orphanages")
        .select("*")
        .eq("qr_code_token", params.token)
        .single();

      if (orphErr || !orph) {
        setError("This QR code is not recognised. Please contact your supervisor.");
        setStage("error");
        return;
      }

      setOrphanage(orph);

      // Get volunteers for this orphanage
      const { data: vols, error: volErr } = await supabase
        .from("volunteers")
        .select("*")
        .eq("orphanage_id", orph.id)
        .order("name");

      if (volErr || !vols?.length) {
        setError("No volunteers are assigned to this orphanage yet.");
        setStage("error");
        return;
      }

      setVolunteers(vols);
      setStage("select");
    }
    load();
  }, [params.token]);

  const handleVolunteerTap = useCallback(
    async (volunteer: Volunteer) => {
      setSelectedVolunteer(volunteer);
      setStage("confirming");

      // Check for open session today
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("volunteer_id", volunteer.id)
        .eq("orphanage_id", orphanage!.id)
        .eq("date", todayDate())
        .is("check_out_time", null)
        .order("check_in_time", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        setOpenSession(sessions[0]);
      } else {
        setOpenSession(null);
      }
    },
    [orphanage]
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedVolunteer || !orphanage) return;

    if (openSession) {
      // Check OUT
      const now = new Date().toISOString();
      const hours = parseFloat(calcHours(openSession.check_in_time, now));

      const { data, error: err } = await supabase
        .from("sessions")
        .update({ check_out_time: now, hours })
        .eq("id", openSession.id)
        .select()
        .single();

      if (err) {
        setError("Failed to record check-out. Try again.");
        setStage("error");
        return;
      }

      setCompletedSession(data);
      setStage("checkout-success");
    } else {
      // Check IN
      const now = new Date().toISOString();
      const { error: err } = await supabase.from("sessions").insert({
        volunteer_id: selectedVolunteer.id,
        orphanage_id: orphanage.id,
        check_in_time: now,
        date: todayDate(),
        check_out_time: null,
        hours: null,
      });

      if (err) {
        setError("Failed to record check-in. Try again.");
        setStage("error");
        return;
      }

      setStage("checkin-success");
    }
  }, [selectedVolunteer, orphanage, openSession]);

  // ── LOADING ──────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-gem-gold border-t-transparent rounded-full animate-spin" style={{borderWidth: 3}} />
          <p className="text-gem-green/60 font-body text-sm">Loading…</p>
        </div>
      </Screen>
    );
  }

  // ── ERROR ──────────────────────────────────────────────
  if (stage === "error") {
    return (
      <Screen>
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl text-gem-green mb-3">Something went wrong</h2>
          <p className="text-gem-green/60 text-sm font-body">{error}</p>
        </div>
      </Screen>
    );
  }

  // ── SELECT VOLUNTEER ──────────────────────────────────────────────
  if (stage === "select") {
    return (
      <Screen>
        <div className="w-full max-w-sm">
          <Header orphanageName={orphanage!.name} />
          <p className="text-gem-green/50 text-xs uppercase tracking-widest text-center mb-6 font-body">
            Tap your name to check in or out
          </p>

          <div className="flex flex-col gap-3">
            {volunteers.map((v, i) => (
              <button
                key={v.id}
                onClick={() => handleVolunteerTap(v)}
                className="volunteer-card bg-white border border-gem-gold/20 rounded-2xl p-5 text-left shadow-sm hover:border-gem-gold hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gem-gold"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gem-green/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-xl text-gem-green font-semibold">
                      {v.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gem-charcoal text-base">{v.name}</p>
                    <p className="font-body text-gem-green/50 text-xs mt-0.5">{v.nysc_code}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-gem-gold text-xl">›</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  // ── CONFIRMING ──────────────────────────────────────────────
  if (stage === "confirming") {
    const isCheckOut = !!openSession;
    return (
      <Screen>
        <div className="w-full max-w-sm text-center">
          <Header orphanageName={orphanage!.name} />

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gem-gold/20 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gem-green mx-auto mb-4 flex items-center justify-center">
              <span className="font-display text-3xl text-gem-cream font-semibold">
                {selectedVolunteer!.name.charAt(0)}
              </span>
            </div>
            <h2 className="font-display text-3xl text-gem-green font-semibold mb-1">
              {selectedVolunteer!.name}
            </h2>
            <p className="text-gem-green/40 text-xs font-body mb-6">{selectedVolunteer!.nysc_code}</p>

            {isCheckOut ? (
              <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-amber-700 font-body font-medium uppercase tracking-wide mb-1">
                  Open session
                </p>
                <p className="font-body text-gem-charcoal text-sm">
                  Checked in at{" "}
                  <span className="font-semibold">{formatTime(openSession!.check_in_time)}</span>
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                <p className="font-body text-emerald-700 text-sm">
                  Ready to check in for today
                </p>
              </div>
            )}

            <div
              className={`w-full py-4 rounded-2xl font-body font-semibold text-white text-base transition-all animate-pulse-gold cursor-pointer ${
                isCheckOut ? "bg-gem-gold-dark bg-amber-700" : "bg-gem-green"
              }`}
              style={{ backgroundColor: isCheckOut ? "#92400e" : "#1A3A2A" }}
              onClick={handleConfirm}
            >
              {isCheckOut ? "✓ Confirm Check-Out" : "✓ Confirm Check-In"}
            </div>
          </div>

          <button
            onClick={() => { setStage("select"); setSelectedVolunteer(null); setOpenSession(null); }}
            className="text-gem-green/40 text-sm font-body hover:text-gem-green transition-colors"
          >
            ← Go back
          </button>
        </div>
      </Screen>
    );
  }

  // ── CHECK-IN SUCCESS ──────────────────────────────────────────────
  if (stage === "checkin-success") {
    return (
      <Screen>
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-gem-green mx-auto flex items-center justify-center mb-6 shadow-xl">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="font-display text-4xl text-gem-green font-semibold mb-2">
              Checked In!
            </h2>
            <p className="text-gem-green/60 font-body text-base">
              Welcome, <span className="font-semibold">{selectedVolunteer!.name}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gem-gold/20 shadow-sm mb-8">
            <p className="text-gem-green/40 text-xs uppercase tracking-widest font-body mb-2">
              Session started
            </p>
            <p className="font-display text-3xl text-gem-green">
              {new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </p>
            <p className="text-gem-green/50 text-sm font-body mt-1">
              {orphanage!.name}
            </p>
          </div>

          <p className="text-gem-green/40 text-xs font-body">
            Scan the QR code again when you leave to check out.
          </p>

          <button
            onClick={() => setStage("select")}
            className="mt-6 text-gem-gold text-sm font-body underline underline-offset-4"
          >
            Another volunteer →
          </button>
        </div>
      </Screen>
    );
  }

  // ── CHECK-OUT SUCCESS ──────────────────────────────────────────────
  if (stage === "checkout-success") {
    const hours = completedSession?.hours ?? 0;
    return (
      <Screen>
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-gem-gold mx-auto flex items-center justify-center mb-6 shadow-xl" style={{backgroundColor: "#C9973A"}}>
              <span className="text-4xl">🌟</span>
            </div>
            <h2 className="font-display text-4xl text-gem-green font-semibold mb-2">
              Great Work!
            </h2>
            <p className="text-gem-green/60 font-body">
              See you next time, {selectedVolunteer!.name}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gem-gold/20 shadow-sm mb-6">
            <p className="text-gem-green/40 text-xs uppercase tracking-widest font-body mb-3">
              Today's session
            </p>
            <p className="font-display text-6xl font-bold mb-1" style={{ color: "#C9973A" }}>
              {hours}
            </p>
            <p className="text-gem-green/60 font-body text-sm">hours served</p>
            <div className="mt-4 pt-4 border-t border-gem-gold/10 flex justify-between text-xs font-body text-gem-green/40">
              <span>In: {formatTime(completedSession!.check_in_time)}</span>
              <span>Out: {formatTime(completedSession!.check_out_time!)}</span>
            </div>
          </div>

          <p className="text-gem-green/40 text-xs font-body italic">
            "To help orphaned children reach their full potential."
          </p>

          <button
            onClick={() => setStage("select")}
            className="mt-6 text-gem-gold text-sm font-body underline underline-offset-4"
          >
            Another volunteer →
          </button>
        </div>
      </Screen>
    );
  }

  return null;
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gem-cream flex flex-col items-center justify-center p-6 relative">
      {/* Decorative top bar */}
      <div className="fixed top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1A3A2A, #C9973A, #1A3A2A)" }} />
      {children}
      {/* Footer */}
      <p className="fixed bottom-4 text-gem-green/20 text-xs font-body">
        NextGem Foundation
      </p>
    </main>
  );
}

function Header({ orphanageName }: { orphanageName: string }) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1A3A2A" }}>
          <span className="text-2xl">💎</span>
        </div>
      </div>
      <h1 className="font-display text-2xl font-semibold text-gem-green mb-0.5">
        {orphanageName}
      </h1>
      <p className="text-gem-green/40 text-xs font-body">
        {new Date().toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })}
      </p>
    </div>
  );
}
