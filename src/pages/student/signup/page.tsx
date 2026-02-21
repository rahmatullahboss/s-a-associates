import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, GraduationCap, User } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function StudentSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-light">
      {/* Left Side - Image */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: '#1E293B' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/20 z-10" />
        <div className="w-full h-full flex items-center justify-center">
          {/* University Building Illustration */}
          <div className="text-center p-8 relative z-20">
            <div className="w-80 h-80 mx-auto bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden border border-white/20 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-white/10" />
              <div className="relative z-10">
                <GraduationCap size={100} className="text-secondary mx-auto mb-4" />
                <div className="w-48 h-32 bg-white/20 rounded-t-2xl mx-auto backdrop-blur-md" />
                <div className="w-56 h-4 bg-white/30 rounded mx-auto" />
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-8 h-16 bg-white/20 rounded-t" />
                  <div className="w-8 h-20 bg-white/20 rounded-t" />
                  <div className="w-8 h-16 bg-white/20 rounded-t" />
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2 font-display">Join S&A Associates</h3>
            <p className="text-white/70 text-lg">Start your educational journey with us</p>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-bg-light"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-4 text-secondary shadow-lg shadow-primary/20">
              <img src="/sa-logo.png" alt="S&A Associates" className="h-10 object-contain" />
            </div>
            <div>
              <span className="text-[#1E293B] font-bold text-xl block font-display">S&A Associates</span>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Education Consultancy</span>
            </div>
          </div>

          {/* Sign Up Heading */}
          <h1 className="text-3xl font-bold text-[#1E293B] text-center mb-8 font-display">Create Account</h1>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
             {/* Name Field */}
             <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={20} />
              </div>
              <input
                type="text"
                name="name"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Full Name"
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Your Email"
              />
            </div>

            {/* Phone Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <span className="text-xl">📞</span>
              </div>
              <input
                type="tel"
                name="phone"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Phone Number"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Create Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isPending ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/student/login" className="text-secondary font-semibold hover:text-[#E05e1F] transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-500 hover:text-[#1E293B] text-sm transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
