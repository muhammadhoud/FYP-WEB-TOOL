import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  GraduationCap, 
  Home, 
  ArrowLeft,
  LogOut,
  ChevronRight
} from "lucide-react";

interface NavigationProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function Navigation({ 
  showBackButton = false, 
  backHref = "/", 
  backLabel = "Back",
  pageTitle,
  breadcrumbs = []
}: NavigationProps = {}) {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-surface shadow-material border-b border-border sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left Section - Brand and Navigation */}
          <div className="flex items-center space-x-6">
            {/* Brand */}
            <Link href="/">
              <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="bg-primary text-primary-foreground rounded-lg p-2">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-medium text-foreground">EduGrade AI</h1>
                  <p className="text-xs text-muted-foreground">Automated Grading Platform</p>
                </div>
              </div>
            </Link>

            {/* Navigation Items */}
            <nav className="flex items-center space-x-1">
              {showBackButton && (
                <Link href={backHref}>
                  <Button variant="ghost" size="sm" className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {backLabel}
                  </Button>
                </Link>
              )}

              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <Link href="/">
                      <Button variant="ghost" size="sm" className="p-1 h-auto font-normal text-muted-foreground hover:text-foreground">
                        <Home className="h-4 w-4" />
                      </Button>
                    </Link>
                  </li>
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      {crumb.href ? (
                        <Link href={crumb.href}>
                          <Button variant="ghost" size="sm" className="p-1 h-auto font-normal text-muted-foreground hover:text-foreground">
                            {crumb.label}
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}

              {/* Page Title */}
              {pageTitle && !breadcrumbs.length && (
                <h2 className="text-lg font-medium text-foreground ml-4">
                  {pageTitle}
                </h2>
              )}
            </nav>
          </div>

          {/* Right Section - User Info and Actions */}
          <div className="flex items-center space-x-4">
            <Badge className="bg-accent/10 text-accent border-accent/20">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connected to Google Classroom
            </Badge>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "User"
                }
              </span>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}