'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, CheckCircle2, Loader2, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountLinkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bondingScore?: number;
  suggestionMessage?: string;
}

type FormStep = 'INPUT' | 'OTP' | 'SUCCESS';
type ContactMethod = 'email' | 'phone';

export const AccountLinkSheet: React.FC<AccountLinkSheetProps> = ({
  open,
  onOpenChange,
  bondingScore = 20,
  suggestionMessage = "You've built a strong connection! Save your memories by linking your account."
}) => {
  const [step, setStep] = useState<FormStep>('INPUT');
  const [method, setMethod] = useState<ContactMethod>('email');
  const [inputValue, setInputValue] = useState('');
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setStep('INPUT');
      setInputValue('');
      setOtpValue(['', '', '', '', '', '']);
    }
  }, [open]);

  // Countdown timer for OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = () => {
    if (!inputValue) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
      setCountdown(60);
    }, 1500);
  };

  const handleVerifyOTP = () => {
    if (otpValue.some(v => !v)) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('SUCCESS');
      // Auto-close after 2 seconds
      setTimeout(() => onOpenChange(false), 2000);
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValue];
    newOtp[index] = value.slice(-1);
    setOtpValue(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:max-w-md mx-auto rounded-t-3xl border-t-0 bg-white/80 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
        
        <div className="p-8 pt-10">
          <AnimatePresence mode="wait">
            {step === 'INPUT' && (
              <motion.div
                key="input-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <SheetHeader className="space-y-3">
                  <div className="mx-auto w-16 h-16 bg-[hsl(var(--pastel-pink)/0.2)] rounded-2xl flex items-center justify-center text-[hsl(var(--pastel-pink))] mb-2">
                    <MessageSquareHeart className="w-8 h-8" />
                  </div>
                  <SheetTitle className="text-2xl font-bold text-center bg-gradient-to-r from-[hsl(var(--pastel-pink))] to-[hsl(var(--pastel-violet))] bg-clip-text text-transparent">
                    Secure Your Connection
                  </SheetTitle>
                  <SheetDescription className="text-center text-gray-500 text-base leading-relaxed">
                    {suggestionMessage} (Bonding: {bondingScore})
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4">
                  <div className="flex bg-gray-100/50 p-1 rounded-xl">
                    <button
                      onClick={() => setMethod('email')}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        method === 'email' ? "bg-white shadow-sm text-[hsl(var(--pastel-violet))]" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                    <button
                      onClick={() => setMethod('phone')}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        method === 'phone' ? "bg-white shadow-sm text-[hsl(var(--pastel-violet))]" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Phone className="w-4 h-4" /> Phone
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={method === 'email' ? 'email' : 'tel'}
                      placeholder={method === 'email' ? 'your@email.com' : '+1 (555) 000-0000'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="h-14 px-4 bg-white/50 border-gray-200 focus:ring-[hsl(var(--pastel-pink)/0.2)] text-lg rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={!inputValue || isLoading}
                    className="w-full h-14 bg-gradient-to-r from-[hsl(var(--pastel-pink))] to-[hsl(var(--pastel-violet))] hover:opacity-90 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-[hsl(var(--pastel-pink)/0.3)]"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Code"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'OTP' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold text-center">Verify It&apos;s You</SheetTitle>
                  <SheetDescription className="text-center text-gray-500">
                    Enter the 6-digit code sent to <span className="font-semibold text-gray-700">{inputValue}</span>
                  </SheetDescription>
                </SheetHeader>

                <div className="flex justify-between gap-2">
                  {otpValue.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-full h-16 text-center text-2xl font-bold bg-gray-100 rounded-xl border-2 border-transparent focus:border-[hsl(var(--pastel-pink))] focus:bg-white outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otpValue.some(v => !v) || isLoading}
                    className="w-full h-14 bg-gradient-to-r from-[hsl(var(--pastel-pink))] to-[hsl(var(--pastel-violet))] hover:opacity-90 text-white rounded-xl text-lg font-semibold transition-all shadow-lg shadow-[hsl(var(--pastel-pink)/0.3)]"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify Account"}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      disabled={countdown > 0}
                      onClick={() => setCountdown(60)}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-[hsl(var(--pastel-violet))] hover:opacity-80 underline"
                      )}
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't get the code? Resend"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'SUCCESS' && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 space-y-6 text-center"
              >
                <div className="mx-auto w-24 h-24 bg-[hsl(var(--pastel-blue)/0.2)] rounded-full flex items-center justify-center text-[hsl(var(--pastel-blue))] mb-4">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Account Linked!</h3>
                  <p className="text-gray-500">Your memories are now safely stored in the cloud.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SheetFooter className="p-6 bg-gray-50 border-t border-gray-100 mt-4">
          <p className="text-xs text-center w-full text-gray-400">
            By linking, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
