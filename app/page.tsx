"use client";
import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Wand2,
  Layers,
  Sparkles,
  Palette,
  ImagePlus,
  Eraser,
  Brush,
  SlidersHorizontal,
  Zap,
  ArrowRight,
  Camera,
  Bot,
  Play,
  Check,
} from "lucide-react";

const features = [
  {
    title: "AI-Powered Editing",
    description:
      "Describe your edits in plain English. Our AI understands your vision and brings it to life.",
    link: "/editor",
  },
  {
    title: "Smart Object Removal",
    description:
      "Remove unwanted objects, people, or backgrounds with a simple brush stroke.",
    link: "/editor",
  },
  {
    title: "Generative Fill",
    description:
      "Expand your images, fill gaps, or replace elements with AI-generated content.",
    link: "/editor",
  },
  {
    title: "Professional Filters",
    description:
      "Apply stunning filters and color grading presets used by professional photographers.",
    link: "/editor",
  },
  {
    title: "Layer Management",
    description:
      "Work with multiple layers, masks, and blending modes like a pro.",
    link: "/editor",
  },
  {
    title: "Non-Destructive Editing",
    description:
      "Every edit is saved as a separate layer. Go back to any point in your editing history.",
    link: "/editor",
  },
];

const capabilities = [
  { icon: Eraser, title: "Remove Objects", color: "from-rose-500 to-pink-500" },
  { icon: ImagePlus, title: "Generative Fill", color: "from-violet-500 to-purple-500" },
  { icon: Palette, title: "Color Grading", color: "from-amber-500 to-orange-500" },
  { icon: Layers, title: "Smart Layers", color: "from-emerald-500 to-teal-500" },
  { icon: Brush, title: "Precision Masking", color: "from-blue-500 to-cyan-500" },
  { icon: SlidersHorizontal, title: "Pro Filters", color: "from-fuchsia-500 to-pink-500" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      {/* Gradient Background Decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-200 opacity-50 blur-3xl" />
        <div className="absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-blue-200 opacity-50 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 h-60 w-60 rounded-full bg-pink-200 opacity-40 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-200 opacity-40 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MagicLens</span>
          </div>
          
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Features</a>
            <a href="#capabilities" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Capabilities</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Pricing</a>
          </div>
          
          <Link href="/editor">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-xl hover:shadow-violet-500/30"
            >
              Open Editor
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2"
            >
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-700">
                Powered by Advanced AI
              </span>
            </motion.div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-7xl lg:text-8xl">
              Edit Images with
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> AI Magic</span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl">
              Transform your images with natural language. Just describe what you want, and watch AI bring your vision to life in seconds.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/editor">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:shadow-2xl hover:shadow-violet-500/30"
                >
                  Start Creating Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <Play className="h-5 w-5 text-violet-600" />
                Watch Demo
              </motion.button>
            </div>
          </motion.div>
          
          {/* Floating Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-20 flex flex-wrap justify-center gap-4"
          >
            {[
              { icon: Eraser, label: "Remove Objects", color: "bg-rose-500" },
              { icon: ImagePlus, label: "Generative Fill", color: "bg-violet-500" },
              { icon: Layers, label: "Smart Layers", color: "bg-emerald-500" },
            ].map((item, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              >
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-lg shadow-gray-200/50">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="relative px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Everything You Need
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Professional-grade editing tools powered by cutting-edge AI, designed for everyone.
            </p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
              >
                <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/50 transition-all hover:border-gray-200 hover:shadow-xl">
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color}`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">
                    Powerful AI-driven tools that make complex edits simple and intuitive.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative bg-gradient-to-b from-gray-50 to-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Why Choose FIBO?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Built for creators who demand professional results without the complexity.
            </p>
          </motion.div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={feature.link}>
                  <div className="group h-full rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/50 transition-all hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 transition-colors group-hover:bg-violet-500">
                      <Check className="h-6 w-6 text-violet-600 transition-colors group-hover:text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chat Preview Section */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                Just Tell AI What You Want
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                No complex tools to learn. Simply describe your edit in plain English, and our AI handles the rest. It&apos;s like having a professional editor at your fingertips.
              </p>
              
              <div className="space-y-4">
                {[
                  "Remove the person in the background",
                  "Make the sky more dramatic",
                  "Change the wall color to blue",
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                      <Bot className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="text-gray-700">&quot;{text}&quot;</span>
                  </motion.div>
                ))}
              </div>
              
              <Link href="/editor">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25"
                >
                  Try It Now
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 shadow-2xl shadow-gray-200/50">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <Bot className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3">
                      <p className="text-sm text-gray-700">How can I help you edit your image today?</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <div className="rounded-2xl rounded-tr-none bg-violet-600 px-4 py-3">
                      <p className="text-sm text-white">Remove the car from the background</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <Bot className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3">
                      <p className="text-sm text-gray-700">Done! I&apos;ve removed the car and filled the area naturally. Would you like any other changes?</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-12 text-center shadow-2xl shadow-violet-500/25 md:p-16"
          >
            {/* Decorative Elements */}
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">
                Ready to Transform Your Images?
              </h2>
              <p className="mb-8 text-lg text-white/80">
                Start editing with AI today. No credit card required.
              </p>
              
              <Link href="/editor">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-violet-600 shadow-lg transition-shadow hover:shadow-xl"
                >
                  Open Editor
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MagicLens</span>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2024 MagicLens. All rights reserved.
            </p>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 transition-colors hover:text-gray-900">Privacy</a>
              <a href="#" className="text-sm text-gray-500 transition-colors hover:text-gray-900">Terms</a>
              <a href="#" className="text-sm text-gray-500 transition-colors hover:text-gray-900">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
