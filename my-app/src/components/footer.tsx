'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { Leaf, MapPin, Mail, Phone, Github, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-emerald-900 to-teal-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, #14b8a6 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-16">
        {/* Newsletter Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Stay Updated on Sustainable Travel
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Get the latest updates on eco-friendly routing technology and sustainability insights delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-8 py-3 rounded-xl font-semibold whitespace-nowrap">
              Subscribe
            </Button>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                EcoRoute
              </h4>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Revolutionizing transportation with AI-powered sustainable routing for a greener future.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h5 className="text-lg font-semibold mb-6 text-emerald-400">Quick Links</h5>
            <ul className="space-y-3">
              {[
                { name: 'Features', href: '/dashboard/auth/signup' },
                { name: 'Pricing', href: '/dashboard/auth/signup' },
                { name: 'About Us', href: '#' },
                { name: 'Contact', href: '#' },
                { name: 'Blog', href: '#' }
              ].map((link) => (
                <li key={link.name}>
                  <motion.div
                    whileHover={{ x: 5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-emerald-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h5 className="text-lg font-semibold mb-6 text-emerald-400">Solutions</h5>
            <ul className="space-y-3">
              {[
                { name: 'Route Planning', href: '/dashboard/auth/signup' },
                { name: 'Carbon Tracking', href: '/dashboard/auth/signup' },
                { name: 'Fleet Management', href: '/dashboard/auth/signup' },
                { name: 'API Access', href: '/dashboard/auth/signin' },
                { name: 'Enterprise', href: '/dashboard/auth/signin' }
              ].map((solution) => (
                <li key={solution.name}>
                  <motion.div
                    whileHover={{ x: 5 }}
                  >
                    <Link
                      href={solution.href}
                      className="text-gray-300 hover:text-emerald-400 transition-colors"
                    >
                      {solution.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h5 className="text-lg font-semibold mb-6 text-emerald-400">Contact</h5>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">hello@ecoroute.app</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-300">San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              {[
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Github, href: "#" }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-white/20 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 EcoRoute. All rights reserved. Built with sustainable technology.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}