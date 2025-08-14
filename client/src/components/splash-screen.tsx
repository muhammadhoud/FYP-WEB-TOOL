import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Sparkles, BookOpen, Brain } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    { icon: GraduationCap, text: "EduGrade AI", subtitle: "Intelligent Grading Platform" },
    { icon: Brain, text: "AI-Powered", subtitle: "Smart Assessment Technology" },
    { icon: BookOpen, text: "Google Classroom", subtitle: "Seamless Integration" },
  ];

  useEffect(() => {
    const stepDuration = duration / steps.length;
    
    const intervals = steps.map((_, index) => {
      return setTimeout(() => {
        setCurrentStep(index);
      }, index * stepDuration);
    });

    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600); // Allow fade-out animation to complete
    }, duration);

    return () => {
      intervals.forEach(clearTimeout);
      clearTimeout(hideTimeout);
    };
  }, [duration, onComplete, steps.length]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 bg-background flex items-center justify-center"
          data-testid="splash-screen"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/20 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 text-center">
            {/* Logo container */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full p-1 blur-sm"
                  style={{ width: 120, height: 120, margin: "auto" }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  className="relative bg-background rounded-full p-6 shadow-material-raised"
                  style={{ width: 120, height: 120 }}
                >
                  <GraduationCap className="w-12 h-12 text-primary mx-auto" />
                </motion.div>
              </div>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-4xl font-bold text-foreground mb-2">
                EduGrade AI
              </h1>
              <p className="text-lg text-muted-foreground">
                Automated Grading Platform
              </p>
            </motion.div>

            {/* Progress steps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center justify-center space-x-8 mb-8"
            >
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: isActive ? 1.1 : 0.8,
                      opacity: isActive || isCompleted ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`p-3 rounded-full mb-2 transition-colors duration-300 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : isCompleted
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-xs transition-colors duration-300 ${
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    }`}>
                      {step.text}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="w-64 mx-auto"
            >
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: duration / 1000, ease: "easeInOut" }}
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-xs text-muted-foreground mt-2"
              >
                {steps[currentStep]?.subtitle || "Loading..."}
              </motion.p>
            </motion.div>

            {/* Sparkle animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1.5, duration: 1, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <Sparkles className="w-6 h-6 text-accent" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}