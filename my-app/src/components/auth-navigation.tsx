'use client';

import { motion } from 'framer-motion';
import { ArrowRight, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthNavigation() {
  const pathname = usePathname();
  const isSignIn = pathname.includes('signin');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20"
    >
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-emerald-100">
        <div className="flex items-center space-x-4">
          {isSignIn ? (
            <>
              <span className="text-gray-600 text-sm">New to EcoRoute?</span>
              <Link href="/dashboard/auth/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </>
          ) : (
            <>
              <span className="text-gray-600 text-sm">Already have an account?</span>
              <Link href="/dashboard/auth/signin">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}