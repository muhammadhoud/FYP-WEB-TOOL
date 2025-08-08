import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Brain, FileCheck, Users } from "lucide-react";

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
            
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary-dark text-primary-foreground">
              Sign in with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            AI-Powered Auto-Grading for Google Classroom
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Streamline your grading workflow with intelligent AI that evaluates student submissions 
            based on customizable criteria, integrates seamlessly with Google Classroom, and provides 
            detailed feedback to help students improve.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="shadow-material hover:shadow-material-raised transition-shadow">
            <CardHeader className="text-center">
              <div className="bg-primary/10 p-3 rounded-lg mx-auto w-fit mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Google Classroom Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Seamlessly connects with your existing Google Classroom setup to fetch students, assignments, and submissions.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material hover:shadow-material-raised transition-shadow">
            <CardHeader className="text-center">
              <div className="bg-accent/10 p-3 rounded-lg mx-auto w-fit mb-4">
                <Brain className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-lg">AI-Powered Grading</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Advanced AI analyzes submissions against your custom criteria and provides fair, consistent grades with detailed feedback.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material hover:shadow-material-raised transition-shadow">
            <CardHeader className="text-center">
              <div className="bg-warning/10 p-3 rounded-lg mx-auto w-fit mb-4">
                <FileCheck className="h-8 w-8 text-warning" />
              </div>
              <CardTitle className="text-lg">Customizable Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Define your own grading rubrics and criteria for each assignment to ensure grading aligns with your educational goals.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-material hover:shadow-material-raised transition-shadow">
            <CardHeader className="text-center">
              <div className="bg-primary/10 p-3 rounded-lg mx-auto w-fit mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Grades are stored locally until you're ready to post them. Full control over when and what gets shared with students.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-surface rounded-lg shadow-material p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Ready to Transform Your Grading?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join educators who are saving hours each week with intelligent auto-grading. 
              Get started in minutes with your Google account.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-3"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
