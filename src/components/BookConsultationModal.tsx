'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addDays, isSameDay } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import pixel from "@/lib/pixel";

// Generate next N days for booking (N fetched from server settings, default 14)
const getAvailableDates = (days = 14) => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    dates.push(addDays(today, i));
  }
  return dates;
};

interface UserInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export function BookConsultationModal({ children, prefillUser }: { children?: React.ReactNode; prefillUser?: UserInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'form' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isOffDay, setIsOffDay] = useState(false);
  const [offNote, setOffNote] = useState<string | undefined>(undefined);
  const [advanceDays, setAdvanceDays] = useState(14);

  // Fetch advance booking days from settings on mount
  useEffect(() => {
    apiFetch<{ settings: { advanceBookingDays?: number } | null }>('/api/settings')
      .then(res => { if (res.settings?.advanceBookingDays) setAdvanceDays(res.settings.advanceBookingDays); })
      .catch(() => {});
  }, []);

  const dates = getAvailableDates(advanceDays);

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setAvailableSlots([]);
    setIsOffDay(false);
    setOffNote(undefined);
    setSlotsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await apiFetch<{ slots: string[]; isOff: boolean; offNote?: string }>(`/api/leads/available-slots?date=${dateStr}`);
      setAvailableSlots(res.slots || []);
      setIsOffDay(res.isOff || false);
      setOffNote(res.offNote);
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      setStep('form');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('date', selectedDate!.toISOString());
    formData.append('timeSlot', selectedTime!);

    try {
      const result = await apiFetch<{ success: boolean; error?: string; meetLink?: string }>("/api/leads/book", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          date: selectedDate!.toISOString(),
          timeSlot: selectedTime!
        }),
      });
      
      if (result.success) {
        if (result.meetLink) setMeetLink(result.meetLink);
        setStep('success');

        // 🎯 Fire Schedule + Lead events — both browser Pixel + server CAPI (awaited)
        const name = (formData.get('name') as string) || '';
        const email = (formData.get('email') as string) || '';
        const phone = (formData.get('phone') as string) || '';

        await pixel.trackWithCAPI('Schedule', {
          content_name: 'Free Counseling Session',
          content_category: 'Consultation Booking',
        }, {
          email,
          phone,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || undefined,
        });

        // Also fire Lead for ad optimisation
        await pixel.trackWithCAPI('Lead', {
          content_name: 'Consultation Booked',
          content_category: 'Booking',
        }, { email, phone });

      } else {
        setError(result.error || 'Failed to book consultation');
      }
    } catch (err) {
        console.error(err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('date');
    setSelectedDate(null);
    setSelectedTime(null);
    setError(null);
    setMeetLink(null);
    setAvailableSlots([]);
    setIsOffDay(false);
    setOffNote(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      setIsOpen(open);
      if (!open) setTimeout(resetForm, 300);
    }}>
      <DialogTrigger asChild>
        {children ? (
            children 
        ) : (
            <Button className="bg-secondary hover:bg-white text-primary hover:text-primary px-8 py-6 text-lg rounded-full font-bold shadow-lg shadow-secondary/20 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
            Book Free Counseling
            <span className="material-symbols-outlined text-lg">flight_takeoff</span>
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 'success' ? 'Booking Confirmed!' : 'Book Free Counseling'}
          </DialogTitle>
          <div className="text-center text-sm text-gray-500 mt-2">
            Schedule a session with our expert counselors.
          </div>
        </DialogHeader>

        {step === 'date' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Select Date
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {dates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={cn(
                      "p-2 text-sm rounded-lg border transition-all text-center hover:border-[#F26522]",
                      selectedDate && isSameDay(date, selectedDate)
                        ? "bg-[#1E293B] text-white border-[#1E293B]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-[#F26522]/5"
                    )}
                  >
                    <div className="font-bold">{format(date, 'MMM d')}</div>
                    <div className="text-xs opacity-80">{format(date, 'EEE')}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Select Time
                </Label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading available slots...</span>
                  </div>
                ) : isOffDay ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-sm text-red-600">
                    <span className="block font-semibold">Not Available</span>
                    <span>{offNote || 'No sessions scheduled on this day.'}</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-sm text-yellow-700">
                    All slots are booked for this day. Please choose another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          "p-2 text-sm rounded-lg border transition-all",
                          selectedTime === time
                            ? "bg-[#1E293B] text-white border-[#1E293B]"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#F26522] hover:bg-[#F26522]/5"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button 
              className="w-full mt-4" 
              onClick={handleNext} 
              disabled={!selectedDate || !selectedTime}
            >
              Next Step
            </Button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="bg-[#F26522]/5 p-4 rounded-lg text-sm text-[#1E293B] mb-4">
              Booking for <strong>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</strong> at <strong>{selectedTime}</strong>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Doe" defaultValue={prefillUser?.name || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="john@example.com" defaultValue={prefillUser?.email || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="e.g. +8801XXXXXXXXX" defaultValue={prefillUser?.phone || ''} />
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('date')} disabled={isLoading}>
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-[#1E293B] hover:bg-[#0F172A]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirm Booking
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">আপনার সেশন কনফার্ম হয়েছে!</h3>
            <p className="text-gray-600 text-sm">
              <strong>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</strong> তারিখে <strong>{selectedTime}</strong> এ আপনার ফ্রি কাউন্সেলিং সেশন বুক হয়েছে।
            </p>
            {meetLink ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4 text-left">
                <p className="text-sm font-semibold text-green-800 mb-2 text-center">📹 Google Meet লিংক</p>
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Join Meeting
                </a>
                <p className="text-xs text-green-700 mt-2 text-center break-all">{meetLink}</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <p className="text-sm text-blue-700">
                  আমাদের কাউন্সেলর শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
                </p>
              </div>
            )}
            <Button onClick={() => setIsOpen(false)} className="mt-4 w-full">
              বন্ধ করুন
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
