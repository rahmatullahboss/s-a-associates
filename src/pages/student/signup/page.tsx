import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, GraduationCap, User } from "lucide-react";
import { API_BASE } from "@/lib/api";
import pixel from "@/lib/pixel";

export default function StudentSignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle error from Google OAuth redirect
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      // Remove error param from URL
      navigate('/student/signup', { replace: true });
    }
  }, [searchParams, navigate]);

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

      // 🎯 Fire CompleteRegistration — dual tracking with CAPI
      pixel.trackWithCAPI('CompleteRegistration', {
        content_name: 'Student Account',
        status: true,
      }, {
        email,
        phone,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
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

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full mb-4 bg-white hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold border border-gray-300 transition-colors flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bg-light text-gray-500">or</span>
            </div>
          </div>

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
