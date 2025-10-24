'use client';

import { motion } from "framer-motion";
import { ChevronRight, MapPin, Zap, Leaf, Users, Award, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/animated-background";
import Footer from "@/components/footer";
import FeaturesShowcase from "@/components/features-showcase";
import Link from "next/link";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Enhanced Animated Background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between p-6 md:p-8"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Leaf className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              EcoRoute
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <motion.a 
              href="#features" 
              className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#about" 
              className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
            >
              About
            </motion.a>
            <motion.a 
              href="#contact" 
              className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
            >
              Contact
            </motion.a>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/dashboard/auth/signin">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </motion.nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-20">
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                  Smart Routes
                </span>
                <br />
                <span className="text-gray-800">Green Future</span>
              </h2>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
            >
              Discover eco-friendly routes powered by advanced AI. Reduce your carbon footprint while saving time and money with intelligent transportation planning that cares about our planet.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <Link href="/dashboard/auth/signup">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 py-5 rounded-2xl text-lg shadow-2xl flex items-center space-x-3 font-semibold transition-all duration-300">
                    <span>Start Planning</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard/auth/signin">
                  <Button variant="outline" className="border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-10 py-5 rounded-2xl text-lg flex items-center space-x-3 font-semibold backdrop-blur-sm bg-white/80">
                    <MapPin className="w-5 h-5" />
                    <span>View Demo</span>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap justify-center items-center gap-8 mb-20 opacity-70"
            >
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span className="text-sm font-medium">Real-time Data</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Carbon Neutral</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="grid md:grid-cols-3 gap-8 mt-24"
          >
            {[
              {
                icon: Zap,
                title: "AI-Powered Optimization",
                description: "Advanced machine learning algorithms analyze traffic patterns, weather conditions, and environmental data to find the most efficient eco-friendly routes.",
                color: "from-yellow-400 to-orange-500"
              },
              {
                icon: Leaf,
                title: "Carbon Footprint Tracking",
                description: "Monitor and reduce your environmental impact with detailed emissions analytics, sustainability scores, and actionable insights for greener travel.",
                color: "from-emerald-400 to-green-500"
              },
              {
                icon: Users,
                title: "Community Insights",
                description: "Leverage crowdsourced data from millions of eco-conscious travelers to discover hidden sustainable routes and local environmental initiatives.",
                color: "from-blue-400 to-teal-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-emerald-100 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <motion.div 
                  className="mt-6 flex items-center text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ x: 5 }}
                >
                  <span className="text-sm">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Stats Section */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-32 bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-emerald-100"
          >
            {[
              { icon: Users, value: "50K+", label: "Active Users", color: "from-blue-500 to-purple-600" },
              { icon: MapPin, value: "2M+", label: "Routes Optimized", color: "from-emerald-500 to-teal-600" },
              { icon: Leaf, value: "30%", label: "Average CO₂ Reduction", color: "from-green-500 to-emerald-600" },
              { icon: Award, value: "4.9★", label: "User Rating", color: "from-yellow-500 to-orange-600" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl font-black text-gray-800 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Features Showcase */}
      <FeaturesShowcase />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
