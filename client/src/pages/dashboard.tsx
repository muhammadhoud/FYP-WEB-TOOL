import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Presentation, 
  Users, 
  ClipboardList, 
  CheckCircle, 
  FolderSync,
  Search,
  FileText,
  Clock,
  AlertCircle
} from "lucide-react";

interface DashboardStats {
  classrooms: number;
  students: number;
  pendingSubmissions: number;
  gradedToday: number;
}

interface Classroom {
  id: string;
  name: string;
  section?: string;
  grade?: string;
  studentCount: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    enabled: isAuthenticated,
  });

  const syncClassroomsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/classrooms/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Classrooms synced successfully from Google Classroom",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to sync classrooms. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background-page">
      <Navigation pageTitle="Dashboard" />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Page Header */}
        <div className="bg-surface shadow-sm border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-medium text-foreground">Dashboard</h2>
                <nav className="flex mt-2" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <li>Home</li>
                    <li><span className="text-xs">›</span></li>
                    <li className="text-foreground">Dashboard</li>
                  </ol>
                </nav>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => syncClassroomsMutation.mutate()}
                  disabled={syncClassroomsMutation.isPending}
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  <FolderSync className={`mr-2 h-4 w-4 ${syncClassroomsMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncClassroomsMutation.isPending ? 'Syncing...' : 'Sync Classrooms'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-surface shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Presentation className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Classrooms</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? '...' : stats?.classrooms || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-surface shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-accent/10 p-3 rounded-lg">
                      <Users className="text-accent h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? '...' : stats?.students || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-surface shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-warning/10 p-3 rounded-lg">
                      <ClipboardList className="text-warning h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Submissions</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? '...' : stats?.pendingSubmissions || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-surface shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-accent/10 p-3 rounded-lg">
                      <CheckCircle className="text-accent h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Graded Today</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? '...' : stats?.gradedToday || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classrooms Section */}
          <Card className="bg-surface shadow-material">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Your Classrooms</h3>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search classrooms..." 
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {classroomsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading classrooms...</p>
                </div>
              ) : classrooms.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No classrooms found. Sync with Google Classroom to get started.</p>
                  <Button 
                    onClick={() => syncClassroomsMutation.mutate()}
                    disabled={syncClassroomsMutation.isPending}
                    className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  >
                    <FolderSync className="mr-2 h-4 w-4" />
                    Sync Classrooms
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((classroom) => (
                    <Card key={classroom.id} className="border border-border hover:shadow-material-raised transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-foreground mb-2">{classroom.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {classroom.grade && classroom.section ? `${classroom.grade} - ${classroom.section}` : classroom.section || classroom.grade || 'No section'}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground space-x-4">
                              <span><Users className="inline mr-1 h-4 w-4" /> {classroom.studentCount || 0} students</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-warning/10 text-warning">
                            View
                          </Badge>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Recent activity</span>
                            <Link href={`/classroom/${classroom.id}`}>
                              <Button 
                                size="sm"
                                className="bg-primary hover:bg-primary-dark text-primary-foreground"
                              >
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-surface shadow-material">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent/10 p-2 rounded-full">
                      <CheckCircle className="text-accent h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">System ready for grading</p>
                      <p className="text-xs text-muted-foreground">Start by syncing your classrooms</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-surface shadow-material">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Quick Actions</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Button 
                    onClick={() => syncClassroomsMutation.mutate()}
                    disabled={syncClassroomsMutation.isPending}
                    className="w-full justify-start bg-primary hover:bg-primary-dark text-primary-foreground"
                  >
                    <FolderSync className="mr-2 h-4 w-4" />
                    Sync Google Classroom
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="mr-2 h-4 w-4" />
                    Set Grading Criteria
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Clock className="mr-2 h-4 w-4" />
                    Review Pending Grades
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
