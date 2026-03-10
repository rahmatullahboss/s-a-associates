"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { format, addDays, startOfWeek } from "date-fns";
import {
  Clock, ChevronLeft, ChevronRight, Loader2,
  Ban, CheckCircle2, XCircle, User, Mail, Phone, GraduationCap,
  RefreshCw, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotResult {
  slots: string[];
  isOff: boolean;
  offNote?: string;
}

interface BookedSlot {
  timeSlot: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  university?: string;
}

interface BookingPreviewDay {
  date: string;
  label: string;
  dayNum: string;
  dayName: string;
  availableSlots: string[];
  bookedSlots: BookedSlot[];
  isOff: boolean;
  offNote?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-orange-100 text-orange-700 border-orange-200" },
  confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-600 border-red-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("flex-1 rounded-xl px-4 py-3 text-white shadow-sm", color)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

interface ProfilePopupProps {
  slot: BookedSlot;
  onClose: () => void;
}

function ProfilePopup({ slot, onClose }: ProfilePopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
              {slot.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">{slot.name}</h4>
              <div className="mt-0.5">
                <StatusBadge status={slot.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-2.5 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-medium">{slot.timeSlot}</span>
          </div>
          {slot.email && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{slot.email}</span>
            </div>
          )}
          {slot.phone && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{slot.phone}</span>
            </div>
          )}
          {slot.university && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{slot.university}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button className="flex-1 py-2 text-sm font-semibold rounded-xl bg-[#137fec] text-white hover:bg-blue-700 transition-colors">
            Confirm
          </button>
          <button className="flex-1 py-2 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Reschedule
          </button>
          <button className="flex-1 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingPreview() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<BookingPreviewDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<BookingPreviewDay | null>(null);
  const [profileSlot, setProfileSlot] = useState<BookedSlot | null>(null);

  // Auto-load on mount — no need to click "Load Preview" separately
  useEffect(() => {
    loadWeek(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Week starts on Monday
  const getWeekDates = (offset: number) => {
    const monday = startOfWeek(addDays(new Date(), offset * 7), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  };

  const loadWeek = async (offset: number) => {
    setLoading(true);
    setSelectedDay(null);
    const weekDates = getWeekDates(offset);

    try {
      const slotResults = await Promise.all(
        weekDates.map(d => {
          const dateStr = format(d, "yyyy-MM-dd");
          return apiFetch<SlotResult>(`/api/leads/available-slots?date=${dateStr}`)
            .then(r => ({ ...r, dateStr }))
            .catch(() => ({ slots: [] as string[], isOff: false, offNote: undefined as string | undefined, dateStr }));
        })
      );

      const bookingsRes = await apiFetch<{ bookings: { date: string; timeSlot: string; name: string; email?: string; phone?: string; status: string; university?: string }[] }>(
        `/api/dashboard/bookings`
      ).catch(() => ({ bookings: [] as { date: string; timeSlot: string; name: string; email?: string; phone?: string; status: string; university?: string }[] }));

      const allBookings = bookingsRes.bookings || [];

      const result: BookingPreviewDay[] = weekDates.map((d, i) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const sr = slotResults[i];
        const dayBookings = allBookings
          .filter(b => b.date === dateStr && b.status !== "cancelled")
          .map(b => ({ timeSlot: b.timeSlot, name: b.name, email: b.email, phone: b.phone, status: b.status, university: b.university }));

        return {
          date: dateStr,
          label: format(d, "EEE, MMM d"),
          dayNum: format(d, "d"),
          dayName: format(d, "EEE"),
          availableSlots: sr.slots || [],
          bookedSlots: dayBookings,
          isOff: sr.isOff,
          offNote: sr.offNote,
        };
      });

      setDays(result);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (newOffset: number) => {
    setWeekOffset(newOffset);
    loadWeek(newOffset);
  };

  const weekDates = getWeekDates(weekOffset);
  const weekLabel = `${format(weekDates[0], "MMM d")} – ${format(weekDates[6], "MMM d, yyyy")}`;

  // Stats
  const totalBookings = days.reduce((s, d) => s + d.bookedSlots.length, 0);
  const confirmed = days.reduce((s, d) => s + d.bookedSlots.filter(b => b.status === "confirmed").length, 0);
  const pending = days.reduce((s, d) => s + d.bookedSlots.filter(b => b.status === "pending").length, 0);
  const totalAvailable = days.reduce((s, d) => s + d.availableSlots.length, 0);

  return (
    <>
      {/* Profile Popup */}
      {profileSlot && <ProfilePopup slot={profileSlot} onClose={() => setProfileSlot(null)} />}

      <div className="space-y-5">
        {/* Refresh button */}
        <div className="flex justify-end">
          <button
            onClick={() => loadWeek(weekOffset)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white text-sm rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading schedule...</span>
          </div>
        )}

        {loaded && !loading && (
          <>
            {/* Stats Bar */}
            <div className="flex gap-3">
              <StatCard label="Total Bookings" value={totalBookings} color="bg-[#137fec]" />
              <StatCard label="Confirmed" value={confirmed} color="bg-emerald-500" />
              <StatCard label="Pending" value={pending} color="bg-orange-400" />
              <StatCard label="Available Slots" value={totalAvailable} color="bg-sky-400" />
            </div>

            {/* Week Navigator */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
              <button
                onClick={() => handleWeekChange(weekOffset - 1)}
                disabled={weekOffset <= 0}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-700">{weekLabel}</span>
              <button
                onClick={() => handleWeekChange(weekOffset + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 7-day grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const isSelected = selectedDay?.date === day.date;
                const totalSlots = day.availableSlots.length + day.bookedSlots.length;
                const bookedCount = day.bookedSlots.length;
                const isFullyBooked = totalSlots > 0 && day.availableSlots.length === 0;
                const hasAvailable = day.availableSlots.length > 0;

                const dayBg = day.isOff
                  ? "bg-gray-100 border-gray-200 text-gray-400"
                  : isSelected
                  ? "bg-[#137fec] border-[#137fec] text-white shadow-md"
                  : isFullyBooked
                  ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                  : hasAvailable
                  ? "bg-green-50 border-green-200 hover:border-green-300"
                  : "bg-white border-gray-100 hover:border-gray-300";

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border text-xs transition-all duration-150",
                      dayBg
                    )}
                  >
                    <span className={cn("font-semibold text-[11px] uppercase tracking-wide", isSelected ? "text-blue-100" : day.isOff ? "text-gray-400" : "text-gray-500")}>
                      {day.dayName}
                    </span>
                    <span className={cn("text-xl font-bold my-1", isSelected ? "text-white" : day.isOff ? "text-gray-300" : "text-gray-800")}>
                      {day.dayNum}
                    </span>
                    {day.isOff ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                        <Ban className="w-2.5 h-2.5" /> Off
                      </span>
                    ) : (
                      <div className="text-center mt-0.5 space-y-0.5">
                        {bookedCount > 0 && (
                          <div className={cn("text-[10px] font-medium", isSelected ? "text-blue-100" : "text-orange-500")}>
                            {bookedCount} booked
                          </div>
                        )}
                        {hasAvailable && (
                          <div className={cn("text-[10px] font-medium", isSelected ? "text-green-200" : "text-green-600")}>
                            {day.availableSlots.length} free
                          </div>
                        )}
                        {totalSlots === 0 && (
                          <div className={cn("text-[10px]", isSelected ? "text-blue-200" : "text-gray-300")}>—</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" />
                Available slots
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block" />
                Fully booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />
                Off / Holiday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#137fec] inline-block" />
                Selected day
              </span>
            </div>

            {/* Day Detail Panel */}
            {selectedDay && (
              <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Panel Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-[#137fec]" />
                    {selectedDay.label}
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedDay.isOff && (
                      <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2.5 py-0.5 rounded-full font-medium">
                        {selectedDay.offNote || "Off / Holiday"}
                      </span>
                    )}
                    {!selectedDay.isOff && (
                      <span className="text-xs text-gray-400">
                        {selectedDay.bookedSlots.length} booked · {selectedDay.availableSlots.length} available
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {selectedDay.isOff ? (
                    <div className="flex items-center gap-2 text-red-400 text-sm py-2">
                      <XCircle className="w-4 h-4" />
                      No sessions available on this day.
                    </div>
                  ) : (
                    <>
                      {/* Booked Slots */}
                      {selectedDay.bookedSlots.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2.5 uppercase tracking-wider">
                            Booked ({selectedDay.bookedSlots.length})
                          </p>
                          <div className="space-y-2">
                            {selectedDay.bookedSlots.map((b, idx) => (
                              <button
                                key={idx}
                                onClick={() => setProfileSlot(b)}
                                className="w-full flex items-center justify-between bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl px-4 py-3 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                                    {b.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#137fec] transition-colors">{b.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">{b.timeSlot}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={b.status} />
                                  <User className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#137fec] transition-colors" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Available Slots */}
                      {selectedDay.availableSlots.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-2.5 uppercase tracking-wider">
                            Available ({selectedDay.availableSlots.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedDay.availableSlots.map((slot) => (
                              <span
                                key={slot}
                                className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-semibold"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDay.availableSlots.length === 0 && selectedDay.bookedSlots.length === 0 && (
                        <p className="text-sm text-gray-400 py-2">
                          No slots configured for this day. Check your weekly schedule settings above.
                        </p>
                      )}

                      {selectedDay.availableSlots.length === 0 && selectedDay.bookedSlots.length > 0 && (
                        <div className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-4 py-2.5 rounded-xl font-medium">
                          ⚠️ All slots are fully booked for this day.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
