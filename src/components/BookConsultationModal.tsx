'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addDays, isSameDay } from 'date-fns';
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

// Generate next 14 days for booking
const getAvailableDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) { // Start from tomorrow
    dates.push(addDays(today, i));
  }
  return dates;
};

// Generate time slots (10 AM to 5 PM)
const timeSlots = [
  "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

export function BookConsultationModal({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'date' | 'form' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const dates = getAvailableDates();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
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
      const result = await apiFetch<{ success: boolean; error?: string }>("/api/leads/book", {
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
        setStep('success');
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        "p-2 text-sm rounded-lg border transition-all hover:border-[#F26522]",
                        selectedTime === time
                          ? "bg-[#1E293B] text-white border-[#1E293B]"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-[#F26522]/5"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
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
              <Input id="name" name="name" required placeholder="John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="john@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="e.g. +8801XXXXXXXXX" />
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
            <p className="text-gray-600">
              Your free counseling session has been submitted!
            </p>
            {meetLink && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <p className="text-sm text-gray-500 mb-2">Join via Google Meet:</p>
                <a href={meetLink} target="_blank" rel="noopener noreferrer" className="text-[#F26522] font-medium underline break-all">
                  {meetLink}
                </a>
              </div>
            )}
            <p className="text-sm text-gray-500 pt-4">
              We have sent a confirmation email with details.
            </p>
            <Button onClick={() => setIsOpen(false)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
