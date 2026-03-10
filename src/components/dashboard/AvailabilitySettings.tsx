"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Plus, CheckCircle, Calendar, Clock, X } from "lucide-react";
import BookingPreview from "./BookingPreview";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Schedule {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Override {
  id?: number;
  date: string;
  isOff: boolean;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export default function AvailabilitySettings() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [newOverride, setNewOverride] = useState<Override>({
    date: "",
    isOff: true,
    startTime: "",
    endTime: "",
    note: "",
  });

  useEffect(() => {
    Promise.all([
      apiFetch<{ schedules: Schedule[] }>("/api/settings/availability/schedules"),
      apiFetch<{ overrides: Override[] }>("/api/settings/availability/overrides"),
    ]).then(([s, o]) => {
      const existing = s.schedules || [];
      const filled: Schedule[] = Array.from({ length: 7 }, (_, i) => {
        const found = existing.find((x) => x.dayOfWeek === i);
        return found ?? { dayOfWeek: i, startTime: "10:00", endTime: "17:00", isActive: false };
      });
      setSchedules(filled);
      setOverrides(o.overrides || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateSchedule = (dayOfWeek: number, field: keyof Schedule, value: string | boolean) => {
    setSchedules(prev => prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s));
  };

  const saveSchedules = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiFetch("/api/settings/availability/schedules", {
        method: "PUT",
        body: JSON.stringify(schedules.filter(s => s.isActive)),
      });
      setSaveMsg({ type: "success", text: "Weekly schedule saved!" });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg({ type: "error", text: "Failed to save schedule." });
    } finally {
      setSaving(false);
    }
  };

  const addOverride = async () => {
    if (!newOverride.date) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await apiFetch<{ overrides: Override[] }>("/api/settings/availability/overrides", {
        method: "POST",
        body: JSON.stringify({
          date: newOverride.date,
          isOff: newOverride.isOff,
          startTime: newOverride.isOff ? null : (newOverride.startTime || null),
          endTime: newOverride.isOff ? null : (newOverride.endTime || null),
          note: newOverride.note || null,
        }),
      });
      setOverrides(res.overrides || []);
      setNewOverride({ date: "", isOff: true, startTime: "", endTime: "", note: "" });
      setSaveMsg({ type: "success", text: "Override added!" });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg({ type: "error", text: "Failed to save override." });
    } finally {
      setSaving(false);
    }
  };

  const deleteOverride = async (id: number) => {
    setSaving(true);
    try {
      await apiFetch(`/api/settings/availability/overrides/${id}`, { method: "DELETE" });
      setOverrides(prev => prev.filter(o => o.id !== id));
    } catch {
      setSaveMsg({ type: "error", text: "Failed to delete override." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-[#137fec]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Save message toast */}
      {saveMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
          saveMsg.type === "success"
            ? "bg-green-50 text-green-700 border border-green-100"
            : "bg-red-50 text-red-700 border border-red-100"
        }`}>
          {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {saveMsg.text}
        </div>
      )}

      {/* ── Weekly Schedule Card ── */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#137fec]" />
              Weekly Schedule
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">Set your recurring weekly availability</p>
          </div>
          <button
            onClick={saveSchedules}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 hover:brightness-110 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Schedule
          </button>
        </div>

        {/* Day rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {schedules.map((s) => (
            <div
              key={s.dayOfWeek}
              className={`px-6 py-4 flex items-center justify-between group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                !s.isActive ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center gap-5">
                {/* Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={s.isActive}
                    onChange={() => updateSchedule(s.dayOfWeek, "isActive", !s.isActive)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#137fec]" />
                </label>

                {/* Day name */}
                <span className={`w-24 text-sm font-bold ${s.isActive ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                  {DAY_NAMES[s.dayOfWeek]}
                </span>

                {/* Time pickers */}
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => updateSchedule(s.dayOfWeek, "startTime", e.target.value)}
                    disabled={!s.isActive}
                    className="w-32 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none disabled:opacity-40 disabled:bg-slate-50"
                  />
                  <span className="text-slate-400 text-xs font-medium">to</span>
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => updateSchedule(s.dayOfWeek, "endTime", e.target.value)}
                    disabled={!s.isActive}
                    className="w-32 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none disabled:opacity-40 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Status badge */}
              {s.isActive ? (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  Available
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full uppercase tracking-wider">
                  Unavailable
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Date Overrides Card ── */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#137fec]" />
            Date Overrides
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Mark specific dates as holidays or set custom hours.</p>
        </div>

        {/* Existing override chips */}
        {overrides.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {overrides.map((o) => (
              <div
                key={o.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${
                  o.isOff
                    ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    : "bg-blue-50 border-blue-100 text-[#137fec] dark:bg-blue-900/20 dark:border-blue-800"
                }`}
              >
                {o.isOff ? (
                  <span className="text-xs">🚫</span>
                ) : (
                  <span className="text-xs">⏰</span>
                )}
                <span>{o.date}</span>
                {o.isOff ? (
                  <span className="text-xs opacity-70">Holiday</span>
                ) : (
                  <span className="text-xs opacity-70">{o.startTime} – {o.endTime}</span>
                )}
                {o.note && <span className="text-xs opacity-60">· {o.note}</span>}
                <button
                  type="button"
                  onClick={() => o.id && deleteOverride(o.id)}
                  className="ml-1 hover:opacity-100 opacity-60 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Override Form */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Add New Override</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Date</label>
              <input
                type="date"
                value={newOverride.date}
                onChange={(e) => setNewOverride(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Override Type</label>
              <select
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none"
                value={newOverride.isOff ? "off" : "custom"}
                onChange={(e) => setNewOverride(prev => ({ ...prev, isOff: e.target.value === "off" }))}
              >
                <option value="off">Full Day Off / Holiday</option>
                <option value="custom">Custom Working Hours</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Eid Holiday"
                value={newOverride.note || ""}
                onChange={(e) => setNewOverride(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none"
              />
            </div>
          </div>

          {!newOverride.isOff && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Start Time</label>
                <input
                  type="time"
                  value={newOverride.startTime || ""}
                  onChange={(e) => setNewOverride(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End Time</label>
                <input
                  type="time"
                  value={newOverride.endTime || ""}
                  onChange={(e) => setNewOverride(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={addOverride}
              disabled={!newOverride.date || saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#137fec] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Override
            </button>
          </div>
        </div>
      </section>

      {/* ── Booking Preview Banner ── */}
      <section
        className="rounded-2xl p-7 flex items-center justify-between text-white overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #0f172a 60%, #1e3a5f)" }}
      >
        {/* Gradient accent */}
        <div className="absolute top-0 right-0 w-72 h-full opacity-30 pointer-events-none bg-gradient-to-l from-[#137fec] to-transparent" />

        <div className="relative z-10">
          <h3 className="text-xl font-bold">Booking Preview</h3>
          <p className="text-slate-400 text-sm mt-1">See how your availability appears to students.</p>
        </div>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="relative z-10 flex items-center gap-2 bg-white text-slate-900 px-7 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all group"
        >
          {showPreview ? "Hide Preview" : "Load Preview"}
          <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </section>

      {/* ── Booking Preview Component ── */}
      {showPreview && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <BookingPreview />
        </div>
      )}
    </div>
  );
}
