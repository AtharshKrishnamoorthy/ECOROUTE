'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { Smartphone, Cloud, Shield, Zap, Globe, Cpu } from "lucide-react";

export default function FeaturesShowcase() {
  const features = [
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Optimized for all devices with responsive, intuitive interfaces that work seamlessly on mobile, tablet, and desktop.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Cloud,
      title: "Real-Time Processing",
      description: "Cloud-powered infrastructure ensures instant route calculations with up-to-the-minute traffic and environmental data.",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: Shield,
      title: "Privacy Protected",
      description: "Your location data is encrypted and never stored. We prioritize your privacy while delivering personalized routing.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Advanced algorithms deliver route suggestions in under 2 seconds, even for complex multi-stop journeys.",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Available worldwide with local environmental data and region-specific sustainability recommendations.",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: Cpu,
      title: "AI-Powered",
      description: "Machine learning algorithms continuously improve route suggestions based on environmental impact and efficiency.",
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-50 via-white to-emerald-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, #10b981 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, #14b8a6 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, #059669 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience next-generation route planning with advanced AI technology designed for the environmentally conscious traveler.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`w-full h-1 bg-gradient-to-r ${feature.gradient} rounded-full`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/dashboard/auth/signup">
              <button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-2xl transition-all duration-300 hover:shadow-emerald-500/25">
                Explore All Features
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}