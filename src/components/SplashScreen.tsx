import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import OmniSaaSLogo from './OmniSaaSLogo';

interface SplashScreenProps {
  onComplete: () => void;
  key?: string;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fill progress bar smoothly over 2.7s so it finishes at 100% at 3s
    const duration = 2700;
    const intervalTime = 15;
    const steps = duration / intervalTime;
    const stepIncrement = 100 / steps;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + stepIncrement, 100);
      });
    }, intervalTime);

    // Auto complete after exactly 3.0 seconds (3000ms) without needing any click
    const timeout = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 select-none"
      id="life4billion-splash-screen"
    >
      {/* Background ambient glowing spheres matching SaaS color palette */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-emerald-500/10 blur-[130px] pointer-events-none"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6">
        {/* Animated Logo Container */}
        <div className="relative mb-8 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.15, 1], 
              opacity: [0.15, 0.35, 0.15] 
            }}
            transition={{ 
              duration: 2.2, 
              ease: 'easeInOut',
              repeat: Infinity 
            }}
            className="absolute w-44 h-44 rounded-full border border-indigo-500/30 blur-sm pointer-events-none"
          />
          
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <OmniSaaSLogo size="xl" />
          </motion.div>
        </div>

        {/* Welcome Heading in American English */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-white"
        >
          Welcome to Life4Billion
        </motion.h1>

        {/* Subtext description in American English */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
          className="text-sm leading-relaxed max-w-xs sm:max-w-sm mb-8 font-medium text-slate-400"
        >
          One App. One Life. Unlimited Growth. The intelligent workspace for money, health, productivity, and business.
        </motion.p>

        {/* 3-Second Processor Loading Bar */}
        <div className="w-56 h-1.5 rounded-full overflow-hidden relative bg-slate-900 border border-slate-800">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        
        <div className="flex items-center justify-between w-56 mt-2.5 text-[11px] font-mono text-slate-400">
          <span className="uppercase tracking-wider">Loading System...</span>
          <span className="font-bold text-indigo-400">{Math.min(100, Math.round(progress))}%</span>
        </div>
      </div>
    </motion.div>
  );
}
