import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch(`${API_BASE}/api/auth/login?loginAs=admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Image */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-muted"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10 z-10" />
        <div className="w-full h-full bg-gradient-to-br from-background to-muted flex items-center justify-center">
          {/* Admin Illustration */}
          <div className="text-center p-8 relative z-20">
            <div className="w-80 h-80 mx-auto bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 relative overflow-hidden border border-white/60 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10" />
              <div className="relative z-10">
                <Shield size={100} className="text-primary mx-auto mb-4" />
                <div className="w-48 h-32 bg-primary/20 rounded-t-2xl mx-auto backdrop-blur-md" />
                <div className="w-56 h-4 bg-primary/30 rounded mx-auto" />
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-8 h-16 bg-primary/20 rounded-t" />
                  <div className="w-8 h-20 bg-primary/20 rounded-t" />
                  <div className="w-8 h-16 bg-primary/20 rounded-t" />
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-primary mb-2 font-display">Welcome Admin</h3>
            <p className="text-muted-foreground text-lg">Sign in to your admin dashboard</p>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-background"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-secondary shadow-lg shadow-primary/20">
              <img src="/sa-logo.png" alt="S&A Associates" className="h-10 object-contain" />
            </div>
            <div>
              <span className="text-primary font-bold text-xl block font-display">S&A Associates</span>
              <span className="text-muted-foreground text-xs uppercase tracking-wider">Education Consultancy</span>
            </div>
          </div>

          {/* Sign In Heading */}
          <h1 className="text-3xl font-bold text-primary text-center mb-8 font-display">Admin Sign In</h1>

          {error && (
            <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

            <form onSubmit={handleLogin} className="space-y-5">
            <input type="hidden" name="loginAs" value="admin" />
            {/* Email Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Your Email"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full pl-12 pr-12 py-4 bg-muted/50 border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Your Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link to="#" className="text-secondary hover:text-secondary/80 text-sm font-medium transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Admin Access Note */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Contact system administrator for access
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
