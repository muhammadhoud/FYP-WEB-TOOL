import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Presentation, 
  Users, 
  ClipboardList, 
  CheckCircle, 
  FolderSync,
  Search,
  FileText,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Award,
  Target
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie
} from "recharts";

interface DashboardStats {
  classrooms: number;
  students: number;
  assignments: number;
  pendingSubmissions: number;
  gradedToday: number;
}

interface DashboardAnalytics {
  gradingTrends: Array<{ date: string; graded: number }>;
  gradeDistribution: { A: number; B: number; C: number; D: number; F: number };
  classroomStats: Array<{
    id: string;
    name: string;
    students: number;
    assignments: number;
    totalGrades: number;
    pendingSubmissions: number;
    averageScore: number;
    completionRate: number;
  }>;
  assignmentAnalytics: Array<{
    id: string;
    title: string;
    classroomName: string;
    averageScore: number;
    submissionRate: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    maxPoints: number;
  }>;
  totalGrades: number;
  averageScore: number;
}

interface Classroom {
  id: string;
  name: string;
  section?: string;
  grade?: string;
  studentCount: number;
}

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: analytics, isLoading: analyticsLoading } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/dashboard/analytics"],
    enabled: isAuthenticated,
  });

  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    enabled: isAuthenticated,
  });

  // Filter classrooms based on search term
  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classroom.section && classroom.section.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (classroom.grade && classroom.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const syncClassroomsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/classrooms/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics"] });
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
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-surface shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Presentation className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Classrooms</p>
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
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <Users className="text-blue-500 h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Students</p>
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
                    <div className="bg-green-500/10 p-3 rounded-lg">
                      <FileText className="text-green-500 h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Assignments</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? '...' : stats?.assignments || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-surface shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-orange-500/10 p-3 rounded-lg">
                      <Clock className="text-orange-500 h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
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
                    <div className="bg-emerald-500/10 p-3 rounded-lg">
                      <CheckCircle className="text-emerald-500 h-6 w-6" />
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

          {/* Analytics Overview - All Charts */}
          <div className="space-y-6">
            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Grade Distribution */}
              <Card className="bg-surface shadow-material">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <PieChart className="h-4 w-4" />
                    <span>Grade Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics?.gradeDistribution ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie
                          data={Object.entries(analytics.gradeDistribution).map(([grade, count], index) => ({
                            name: grade,
                            value: count,
                            fill: CHART_COLORS[index % CHART_COLORS.length]
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(analytics.gradeDistribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No grade data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Performance */}
              <Card className="bg-surface shadow-material">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Target className="h-4 w-4" />
                    <span>Assignment Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics?.assignmentAnalytics && analytics.assignmentAnalytics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.assignmentAnalytics.slice(0, 4)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="title" 
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#3b82f6" name="Average Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No assignment data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grading Trends */}
              <Card className="bg-surface shadow-material">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    <span>Grading Activity (7 Days)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics?.gradingTrends && analytics.gradingTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={analytics.gradingTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="graded" 
                          stroke="#3b82f6" 
                          fill="#3b82f680" 
                          name="Submissions Graded"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No grading activity data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Secondary Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Classroom Performance Comparison */}
              <Card className="bg-surface shadow-material">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Presentation className="h-4 w-4" />
                    <span>Classroom Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics?.classroomStats && analytics.classroomStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.classroomStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#10b981" name="Average Score %" />
                        <Bar dataKey="completionRate" fill="#3b82f6" name="Completion Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No classroom data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Assignment Performance */}
              <Card className="bg-surface shadow-material">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Award className="h-4 w-4" />
                    <span>Recent Assignments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics?.assignmentAnalytics && analytics.assignmentAnalytics.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {analytics.assignmentAnalytics.slice(0, 3).map((assignment) => (
                        <div key={assignment.id} className="border border-border rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm text-foreground truncate">{assignment.title}</h4>
                            <Badge variant={assignment.averageScore >= 80 ? "default" : "secondary"} className="text-xs">
                              {assignment.averageScore}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Submissions</p>
                              <p className="font-medium">{assignment.totalSubmissions}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Graded</p>
                              <p className="font-medium">{assignment.gradedSubmissions}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Rate</p>
                              <p className="font-medium">{assignment.submissionRate}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No assignment data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Overall Statistics */}
            <Card className="bg-surface shadow-material">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Overall Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {analytics?.averageScore || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Overall Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {analytics?.totalGrades || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Grades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">
                      {analytics?.classroomStats.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Classes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">
                      {analytics?.assignmentAnalytics.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Assignments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Classroom Management */}
            <Card className="bg-surface shadow-material">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Your Classrooms</span>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input 
                        type="text" 
                        placeholder="Search classrooms..." 
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classroomsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading classrooms...</p>
                  </div>
                ) : filteredClassrooms.length === 0 && searchTerm ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No classrooms found matching "{searchTerm}"</p>
                    <Button 
                      onClick={() => setSearchTerm("")}
                      variant="outline"
                    >
                      Clear search
                    </Button>
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
                    {filteredClassrooms.map((classroom) => {
                      const classroomStats = analytics?.classroomStats.find(stat => stat.id === classroom.id);
                      return (
                        <Card key={classroom.id} className="border border-border hover:shadow-material-raised transition-shadow cursor-pointer">
                          <CardContent className="p-6">
                            <Link href={`/classroom/${classroom.id}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-lg font-medium text-foreground mb-2">{classroom.name}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {classroom.grade && classroom.section ? `${classroom.grade} - ${classroom.section}` : classroom.section || classroom.grade || 'No section'}
                                  </p>
                                  
                                  {/* Classroom Statistics */}
                                  <div className="space-y-3">
                                    <div className="flex items-center text-sm text-muted-foreground space-x-4">
                                      <span className="flex items-center">
                                        <Users className="inline mr-1 h-4 w-4" /> 
                                        {classroom.studentCount || 0} students
                                      </span>
                                      <span className="flex items-center">
                                        <FileText className="inline mr-1 h-4 w-4" /> 
                                        {classroomStats?.assignments || 0} assignments
                                      </span>
                                    </div>
                                    
                                    {classroomStats && (
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-muted-foreground">Average Score</span>
                                          <Badge variant={classroomStats.averageScore >= 80 ? "default" : "secondary"}>
                                            {classroomStats.averageScore}%
                                          </Badge>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                          <span className="text-muted-foreground">Completion Rate</span>
                                          <span className="font-medium">{classroomStats.completionRate}%</span>
                                        </div>
                                        
                                        {classroomStats.pendingSubmissions > 0 && (
                                          <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Pending</span>
                                            <Badge variant="outline" className="text-orange-500">
                                              {classroomStats.pendingSubmissions}
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="ml-4">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                    View
                                  </Badge>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}