"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Orphanage = { id: string; name: string; qr_code_token: string };
type Volunteer = { id: string; name: string; nysc_code: string; orphanage_id: string };
type Session = {
  id: string;
  volunteer_id: string;
  orphanage_id: string;
  check_in_time: string;
  check_out_time: string | null;
  date: string;
  hours: number | null;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";
const DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || "nextgem2024";

function isFlagged(session: Session) {
  if (session.check_out_time) return false;
  const now = new Date().getTime();
  const checkIn = new Date(session.check_in_time).getTime();
  return now - checkIn > 8 * 60 * 60 * 1000;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatHours(h: number | null) {
  if (!h) return "—";
  return `${h.toFixed(2)}h`;
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [tab, setTab] = useState<"overview" | "sessions" | "orphanages">("overview");

  const [orphanages, setOrphanages] = useState<Orphanage[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  // Add forms
  const [newOrph, setNewOrph] = useState({ name: "", qr_code_token: "" });
  const [newVol, setNewVol] = useState({ name: "", nysc_code: "", orphanage_id: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: o }, { data: v }, { data: s }] = await Promise.all([
      supabase.from("orphanages").select("*").order("name"),
      supabase.from("volunteers").select("*").order("name"),
      supabase.from("sessions").select("*").order("check_in_time", { ascending: false }).limit(200),
    ]);
    setOrphanages(o || []);
    setVolunteers(v || []);
    setSessions(s || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function handleLogin() {
    if (password === DASHBOARD_PASSWORD) {
      setAuthed(true);
    } else {
      setPwError("Incorrect password.");
    }
  }

  async function addOrphanage() {
    if (!newOrph.name || !newOrph.qr_code_token) return;
    await supabase.from("orphanages").insert(newOrph);
    setNewOrph({ name: "", qr_code_token: "" });
    load();
  }

  async function addVolunteer() {
    if (!newVol.name || !newVol.nysc_code || !newVol.orphanage_id) return;
    await supabase.from("volunteers").insert(newVol);
    setNewVol({ name: "", nysc_code: "", orphanage_id: "" });
    load();
  }

  // ── LOGIN ──────────────────────────────────────────────
  if (!authed) {
    return (
      <main className="min-h-screen bg-gem-green flex items-center justify-center p-6">
        <div className="bg-gem-cream rounded-3xl p-10 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-4xl">💎</span>
            <h1 className="font-display text-3xl text-gem-green font-semibold mt-3">
              Admin Dashboard
            </h1>
            <p className="text-gem-green/40 font-body text-sm mt-1">NextGem Foundation</p>
          </div>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 rounded-xl border border-gem-gold/30 bg-white font-body text-gem-charcoal mb-3 focus:outline-none focus:ring-2 focus:ring-gem-gold"
          />
          {pwError && <p className="text-red-500 text-xs font-body mb-3">{pwError}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl font-body font-semibold text-white"
            style={{ backgroundColor: "#1A3A2A" }}
          >
            Enter Dashboard
          </button>
        </div>
      </main>
    );
  }

  // Compute stats
  const totalHours = sessions.reduce((acc, s) => acc + (s.hours || 0), 0);
  const flaggedSessions = sessions.filter(isFlagged);
  const activeSessions = sessions.filter((s) => !s.check_out_time);

  const volunteerHours = volunteers.map((v) => ({
    ...v,
    total: sessions.filter((s) => s.volunteer_id === v.id).reduce((a, s) => a + (s.hours || 0), 0),
    sessionCount: sessions.filter((s) => s.volunteer_id === v.id).length,
    orphanage: orphanages.find((o) => o.id === v.orphanage_id),
  })).sort((a, b) => b.total - a.total);

  // ── DASHBOARD ──────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gem-cream">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-gem-green shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <h1 className="font-display text-xl text-gem-cream font-semibold leading-none">
                NextGem Foundation
              </h1>
              <p className="text-gem-gold text-xs font-body">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="text-gem-gold/60 hover:text-gem-gold text-sm font-body transition-colors"
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => setAuthed(false)}
              className="ml-4 text-gem-cream/40 hover:text-gem-cream text-sm font-body transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Volunteers" value={volunteers.length} icon="👤" />
          <StatCard label="Orphanages" value={orphanages.length} icon="🏠" />
          <StatCard label="Total Hours" value={`${totalHours.toFixed(1)}h`} icon="⏱" gold />
          <StatCard
            label="Flagged Sessions"
            value={flaggedSessions.length}
            icon="⚠️"
            alert={flaggedSessions.length > 0}
          />
        </div>

        {/* Flagged alert */}
        {flaggedSessions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="font-body font-semibold text-amber-800 text-sm mb-2">
              ⚠️ {flaggedSessions.length} session(s) checked in 8+ hours ago with no check-out
            </p>
            {flaggedSessions.map((s) => {
              const vol = volunteers.find((v) => v.id === s.volunteer_id);
              const orph = orphanages.find((o) => o.id === s.orphanage_id);
              return (
                <p key={s.id} className="font-body text-amber-700 text-xs">
                  • {vol?.name} at {orph?.name} — checked in {formatDateTime(s.check_in_time)}
                </p>
              );
            })}
          </div>
        )}

        {/* Active sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
            <p className="font-body font-semibold text-emerald-800 text-sm mb-2">
              🟢 {activeSessions.length} active session(s) right now
            </p>
            {activeSessions.map((s) => {
              const vol = volunteers.find((v) => v.id === s.volunteer_id);
              const orph = orphanages.find((o) => o.id === s.orphanage_id);
              return (
                <p key={s.id} className="font-body text-emerald-700 text-xs">
                  • {vol?.name} at {orph?.name} — since {formatDateTime(s.check_in_time)}
                </p>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gem-cream-dark rounded-xl p-1 mb-6 w-fit">
          {(["overview", "sessions", "orphanages"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-body text-sm font-medium transition-all capitalize ${
                tab === t
                  ? "bg-gem-green text-gem-cream shadow-sm"
                  : "text-gem-green/50 hover:text-gem-green"
              }`}
              style={tab === t ? { backgroundColor: "#1A3A2A" } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {tab === "overview" && (
          <div>
            <h2 className="font-display text-2xl text-gem-green mb-4">Volunteer Hours</h2>
            <div className="bg-white rounded-2xl border border-gem-gold/10 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gem-gold/10">
                    <Th>Volunteer</Th>
                    <Th>NYSC Code</Th>
                    <Th>Orphanage</Th>
                    <Th>Sessions</Th>
                    <Th>Total Hours</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 font-body text-gem-green/40 text-sm">Loading…</td></tr>
                  ) : volunteerHours.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 font-body text-gem-green/40 text-sm">No volunteers yet</td></tr>
                  ) : volunteerHours.map((v, i) => (
                    <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-gem-cream/40"}>
                      <Td bold>{v.name}</Td>
                      <Td mono>{v.nysc_code}</Td>
                      <Td>{v.orphanage?.name || "—"}</Td>
                      <Td>{v.sessionCount}</Td>
                      <Td gold>{v.total > 0 ? `${v.total.toFixed(2)}h` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: SESSIONS */}
        {tab === "sessions" && (
          <div>
            <h2 className="font-display text-2xl text-gem-green mb-4">All Sessions</h2>
            <div className="bg-white rounded-2xl border border-gem-gold/10 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gem-gold/10">
                    <Th>Volunteer</Th>
                    <Th>Orphanage</Th>
                    <Th>Date</Th>
                    <Th>Check In</Th>
                    <Th>Check Out</Th>
                    <Th>Hours</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 font-body text-gem-green/40 text-sm">Loading…</td></tr>
                  ) : sessions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 font-body text-gem-green/40 text-sm">No sessions yet</td></tr>
                  ) : sessions.map((s, i) => {
                    const vol = volunteers.find((v) => v.id === s.volunteer_id);
                    const orph = orphanages.find((o) => o.id === s.orphanage_id);
                    const flagged = isFlagged(s);
                    return (
                      <tr key={s.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gem-cream/40"} ${flagged ? "bg-amber-50" : ""}`}>
                        <Td bold>{vol?.name || "—"}</Td>
                        <Td>{orph?.name || "—"}</Td>
                        <Td>{s.date}</Td>
                        <Td>{formatDateTime(s.check_in_time)}</Td>
                        <Td>{s.check_out_time ? formatDateTime(s.check_out_time) : "—"}</Td>
                        <Td gold>{formatHours(s.hours)}</Td>
                        <Td>
                          {flagged ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-body">⚠️ Flagged</span>
                          ) : !s.check_out_time ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-body">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gem-green/10 text-gem-green text-xs font-body">Done</span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ORPHANAGES */}
        {tab === "orphanages" && (
          <div className="space-y-8">
            {/* Add orphanage */}
            <div>
              <h2 className="font-display text-2xl text-gem-green mb-4">Orphanages</h2>
              <div className="bg-white rounded-2xl p-6 border border-gem-gold/10 shadow-sm mb-4">
                <h3 className="font-body font-semibold text-gem-green text-sm mb-4 uppercase tracking-wide">
                  Add Orphanage
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <input
                    placeholder="Orphanage name"
                    value={newOrph.name}
                    onChange={(e) => setNewOrph({ ...newOrph, name: e.target.value })}
                    className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gem-gold/20 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gem-gold"
                  />
                  <input
                    placeholder="QR token (e.g. hope-house-01)"
                    value={newOrph.qr_code_token}
                    onChange={(e) => setNewOrph({ ...newOrph, qr_code_token: e.target.value })}
                    className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gem-gold/20 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gem-gold"
                  />
                  <button
                    onClick={addOrphanage}
                    className="px-5 py-2 rounded-xl font-body text-sm font-semibold text-white"
                    style={{ backgroundColor: "#1A3A2A" }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {orphanages.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl p-5 border border-gem-gold/10 shadow-sm mb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-body font-semibold text-gem-green">{o.name}</h4>
                      <p className="font-body text-xs text-gem-green/40 mt-0.5 font-mono">{o.qr_code_token}</p>
                    </div>
                    <div className="text-right text-xs font-body text-gem-green/50">
                      <p className="font-semibold text-gem-green">
                        {volunteers.filter((v) => v.orphanage_id === o.id).length} volunteers
                      </p>
                      <p className="mt-1 break-all text-gem-gold" style={{ maxWidth: 280 }}>
                        {APP_URL}/scan/{o.qr_code_token}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gem-gold/10">
                    <p className="font-body text-xs text-gem-green/40 mb-2">Assigned volunteers:</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteers.filter((v) => v.orphanage_id === o.id).map((v) => (
                        <span key={v.id} className="px-3 py-1 rounded-full bg-gem-cream text-gem-green text-xs font-body">
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add volunteer */}
            <div>
              <h2 className="font-display text-2xl text-gem-green mb-4">Volunteers</h2>
              <div className="bg-white rounded-2xl p-6 border border-gem-gold/10 shadow-sm">
                <h3 className="font-body font-semibold text-gem-green text-sm mb-4 uppercase tracking-wide">
                  Add Volunteer
                </h3>
                <div className="flex gap-3 flex-wrap">
                  <input
                    placeholder="Full name"
                    value={newVol.name}
                    onChange={(e) => setNewVol({ ...newVol, name: e.target.value })}
                    className="flex-1 min-w-40 px-4 py-2 rounded-xl border border-gem-gold/20 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gem-gold"
                  />
                  <input
                    placeholder="NYSC code"
                    value={newVol.nysc_code}
                    onChange={(e) => setNewVol({ ...newVol, nysc_code: e.target.value })}
                    className="flex-1 min-w-40 px-4 py-2 rounded-xl border border-gem-gold/20 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gem-gold"
                  />
                  <select
                    value={newVol.orphanage_id}
                    onChange={(e) => setNewVol({ ...newVol, orphanage_id: e.target.value })}
                    className="flex-1 min-w-40 px-4 py-2 rounded-xl border border-gem-gold/20 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gem-gold bg-white"
                  >
                    <option value="">Select orphanage</option>
                    {orphanages.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addVolunteer}
                    className="px-5 py-2 rounded-xl font-body text-sm font-semibold text-white"
                    style={{ backgroundColor: "#1A3A2A" }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, gold, alert }: { label: string; value: string | number; icon: string; gold?: boolean; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm ${alert ? "border-amber-300 bg-amber-50" : "border-gem-gold/10"}`}>
      <div className="flex items-start justify-between">
        <p className="font-body text-xs text-gem-green/40 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`font-display text-3xl font-semibold mt-2 ${gold ? "text-gem-gold" : alert ? "text-amber-700" : "text-gem-green"}`}
         style={gold ? { color: "#C9973A" } : alert ? { color: "#92400e" } : { color: "#1A3A2A" }}>
        {value}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-body text-xs text-gem-green/40 uppercase tracking-wider font-medium">
      {children}
    </th>
  );
}

function Td({ children, bold, gold, mono }: { children: React.ReactNode; bold?: boolean; gold?: boolean; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 font-body text-sm ${bold ? "font-semibold text-gem-charcoal" : "text-gem-green/70"} ${mono ? "font-mono text-xs" : ""}`}
        style={gold && children !== "—" ? { color: "#C9973A", fontWeight: 600 } : {}}>
      {children}
    </td>
  );
}
