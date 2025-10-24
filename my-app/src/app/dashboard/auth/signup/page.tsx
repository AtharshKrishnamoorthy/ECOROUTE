'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Leaf, Github, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signInWithGoogle, signInWithGithub } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const passwordStrength = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signUp(formData.email, formData.password);
    if (result.success) {
      setSuccess(true);
      toast.success('Account created successfully! Welcome to EcoRoute!');
    } else if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success('Redirecting to Google...');
    } catch (err: any) {
      const errorMessage = err.message || 'Google sign up failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    try {
      setIsLoading(true);
      await signInWithGithub();
      toast.success('Redirecting to GitHub...');
    } catch (err: any) {
      const errorMessage = err.message || 'GitHub sign up failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to EcoRoute!</h2>
          <p className="text-gray-600 mb-8">
            Thank you for joining our sustainable journey. Please check your email to verify your account.
          </p>
          <Button
            onClick={() => router.push('/dashboard/auth/signin')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Continue to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
        
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 -left-20 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center space-x-2 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                EcoRoute
              </h1>
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Join EcoRoute</h2>
            <p className="text-gray-600">Start your sustainable journey today</p>
          </div>

          {/* Auth Card */}
          <motion.div
            className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-emerald-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-12 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-12 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-12 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-12 pr-12 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center space-x-1 ${passwordStrength.length ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.uppercase ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                        <span>Uppercase</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.lowercase ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                        <span>Lowercase</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordStrength.number ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <Check className="w-3 h-3" />
                        <span>Number</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-12 pr-12 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl ${
                      formData.confirmPassword && !passwordsMatch ? 'border-red-300' : ''
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                    I agree to the{' '}
                    <Link href="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="newsletter"
                    checked={subscribeToNewsletter}
                    onCheckedChange={(checked) => setSubscribeToNewsletter(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="newsletter" className="text-sm text-gray-600 leading-5">
                    Subscribe to our newsletter for sustainability tips and product updates
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch || !agreeToTerms}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Social Auth */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">Continue with Google</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleGithubSignUp}
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-center space-x-3"
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">Continue with GitHub</span>
                </Button>
              </motion.div>
            </div>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/dashboard/auth/signin"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Back to Home */}
          <motion.div 
            className="text-center mt-6"
            whileHover={{ scale: 1.05 }}
          >
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-emerald-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}