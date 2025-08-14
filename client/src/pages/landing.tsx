import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { GraduationCap, Brain, FileCheck, Users, Sparkles, Zap, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background-page">
      {/* Header */}
      <header className="bg-surface shadow-material border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground rounded-lg p-2">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-foreground">EduGrade AI</h1>
                <p className="text-sm text-muted-foreground">Automated Grading Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button onClick={handleLogin} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                Sign in with Google
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/10 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div 
          className="text-center mb-12 relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <div className="flex justify-center items-center space-x-2 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-6 w-6 text-accent" />
              </motion.div>
              <span className="text-sm font-medium text-accent uppercase tracking-wider">
                Revolutionary AI Technology
              </span>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-6 w-6 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              AI-Powered Auto-Grading
            </span>
            <br />
            <span className="text-foreground">for Google Classroom</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Streamline your grading workflow with intelligent AI that evaluates student submissions 
            based on customizable criteria, integrates seamlessly with Google Classroom, and provides 
            detailed feedback to help students improve.
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            {[
              "Save 10+ hours per week",
              "Consistent grading standards",
              "Instant detailed feedback"
            ].map((feature, index) => (
              <motion.div
                key={feature}
                className="flex items-center space-x-2 text-accent font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              >
                <CheckCircle className="h-5 w-5" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          {[
            {
              icon: Users,
              title: "Google Classroom Integration",
              description: "Seamlessly connects with your existing Google Classroom setup to fetch students, assignments, and submissions.",
              color: "primary",
              delay: 0
            },
            {
              icon: Brain,
              title: "AI-Powered Grading",
              description: "Advanced AI analyzes submissions against your custom criteria and provides fair, consistent grades with detailed feedback.",
              color: "accent",
              delay: 0.1
            },
            {
              icon: FileCheck,
              title: "Customizable Criteria",
              description: "Define your own grading rubrics and criteria for each assignment to ensure grading aligns with your educational goals.",
              color: "warning",
              delay: 0.2
            },
            {
              icon: GraduationCap,
              title: "Secure & Private",
              description: "Grades are stored locally until you're ready to post them. Full control over when and what gets shared with students.",
              color: "primary",
              delay: 0.3
            }
          ].map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.4 + feature.delay, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { duration: 0.2 } 
                }}
                data-testid={`feature-card-${index}`}
              >
                <Card className="shadow-material hover:shadow-material-raised transition-all duration-300 h-full bg-card border-border group">
                  <CardHeader className="text-center">
                    <motion.div 
                      className={`bg-${feature.color}/10 p-3 rounded-lg mx-auto w-fit mb-4 group-hover:bg-${feature.color}/20 transition-colors duration-300`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <IconComponent className={`h-8 w-8 text-${feature.color}`} />
                    </motion.div>
                    <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <motion.div 
            className="bg-surface rounded-lg shadow-material p-8 max-w-2xl mx-auto border border-border relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-50" />
            
            <div className="relative z-10">
              <motion.h3 
                className="text-2xl font-semibold text-foreground mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.6 }}
              >
                Ready to Transform Your Grading?
              </motion.h3>
              
              <motion.p 
                className="text-muted-foreground mb-6 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.6 }}
              >
                Join educators who are saving hours each week with intelligent auto-grading. 
                Get started in minutes with your Google account.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="cta-login-button"
                >
                  <motion.svg 
                    className="w-5 h-5 mr-3" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </motion.svg>
                  Continue with Google
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
