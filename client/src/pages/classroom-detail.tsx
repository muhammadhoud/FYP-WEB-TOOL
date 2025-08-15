import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import GradingModal from "@/components/grading-modal";
import ResultsAnalytics from "@/components/results-analytics";
import OverallResultsModal from "@/components/overall-results-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { 
  Users, 
  FileText, 
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileDown,
  X,
  Download,
  Brain
} from "lucide-react";

interface ClassroomDetail {
  id: string;
  name: string;
  section?: string;
  grade?: string;
  description?: string;
  students: Student[];
  assignments: Assignment[];
}

interface Student {
  id: string;
  name: string;
  email?: string;
  profileImageUrl?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  maxPoints?: number;
  dueDate?: string;
  gradingCriteria?: GradingCriterion[];
}

interface Submission {
  id: string;
  fileName?: string;
  submittedAt?: string;
  isGraded: boolean;
  status?: 'ungraded' | 'pending' | 'graded' | 'error';
  student: Student;
  grade?: {
    totalScore: number;
    maxScore: number;
    feedback?: string;
    criteriaScores?: Record<string, number>;
  };
  fileUrl?: string;
  attachedFiles?: Array<{id: string, name: string}>;
}

interface GradingCriterion {
  id: string;
  assignmentId: string;
  name: string;
  maxScore: number;
  description?: string;
}

export default function ClassroomDetail() {
  const [, params] = useRoute("/classroom/:id");
  const classroomId = params?.id;
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{id: string, name: string}>>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [gradingAll, setGradingAll] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'submissions' | 'results'>('submissions');
  const [showOverallResults, setShowOverallResults] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: classroom, isLoading: classroomLoading, error } = useQuery<ClassroomDetail>({
    queryKey: ["/api/classrooms", classroomId],
    enabled: isAuthenticated && !!classroomId,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ["/api/assignments", selectedAssignment?.id, "submissions"],
    enabled: isAuthenticated && !!selectedAssignment?.id,
  });

  const hasGradingCriteria = selectedAssignment?.gradingCriteria && selectedAssignment.gradingCriteria.length > 0;

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsGradingModalOpen(true);
  };

  const closeGradingModal = () => {
    setIsGradingModalOpen(false);
    setSelectedSubmission(null);
  };

  const openPreviewModal = (submission: Submission) => {
    const files = submission.attachedFiles || [];
    if (files.length === 0) {
      toast({
        title: "No File",
        description: "This submission does not have any attached files.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFiles(files);
    setSelectedFileIndex(0);
    setPreviewFileUrl(`/api/files/${files[0].id}/preview`);
    setIsPreviewModalOpen(true);
  };

  const switchPreviewFile = (index: number) => {
    if (selectedFiles[index]) {
      setSelectedFileIndex(index);
      setPreviewFileUrl(`/api/files/${selectedFiles[index].id}/preview`);
    }
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewFileUrl(null);
  };

  const handleAssignmentSelection = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    // Clear previously selected submission when changing assignments
    setSelectedSubmission(null);
    setIsGradingModalOpen(false);
    setIsPreviewModalOpen(false);
  };

  // Bulk grading function with instant status updates
  const gradeAllSubmissions = async (assignmentId: string) => {
    if (!hasGradingCriteria) {
      toast({
        title: "No Grading Criteria",
        description: "Please set grading criteria for this assignment first",
        variant: "destructive",
      });
      return;
    }

    const ungradedSubmissions = submissions.filter(s => !s.isGraded && s.status !== 'pending');
    if (ungradedSubmissions.length === 0) {
      toast({
        title: "All Graded",
        description: "All submissions are already graded or in progress",
      });
      return;
    }

    setGradingAll(true);
    
    // Instantly mark all submissions as pending
    try {
      await fetch(`/api/assignments/${assignmentId}/submissions/mark-pending`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionIds: ungradedSubmissions.map(s => s.id) }),
      });
      
      // Refresh to show pending status immediately
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      
      toast({
        title: "Grading Started",
        description: `${ungradedSubmissions.length} submissions marked as pending. Grading in progress...`,
      });
    } catch (error) {
      console.error('Failed to mark submissions as pending:', error);
    }

    try {
      let gradedCount = 0;
      let errorCount = 0;
      
      // Process submissions with better error handling
      for (const submission of ungradedSubmissions) {
        try {
          const response = await fetch(`/api/submissions/${submission.id}/grade`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (response.ok) {
            gradedCount++;
          } else {
            errorCount++;
            console.error(`Failed to grade submission ${submission.id}:`, response.status);
          }
          
          // Update progress every few submissions
          if ((gradedCount + errorCount) % 3 === 0 || (gradedCount + errorCount) === ungradedSubmissions.length) {
            toast({
              title: "Progress Update",
              description: `Processed ${gradedCount + errorCount}/${ungradedSubmissions.length} submissions`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
          }
        } catch (error) {
          errorCount++;
          console.error(`Failed to grade submission ${submission.id}:`, error);
        }
      }

      // Final refresh
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: "Bulk Grading Complete",
        description: `Successfully graded ${gradedCount} submissions${errorCount > 0 ? `, ${errorCount} failed` : ''}. View results in the Results tab.`,
      });
      
      // Switch to results tab
      setActiveTab('results');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete bulk grading",
        variant: "destructive",
      });
    } finally {
      setGradingAll(false);
    }
  };

  // Download all submissions function
  const downloadAllSubmissions = async (assignmentId: string) => {
    if (submissions.length === 0) {
      toast({
        title: "No Submissions",
        description: "No submissions available to download",
        variant: "destructive",
      });
      return;
    }

    setDownloadingAll(true);
    try {
      // Get all files metadata
      const response = await fetch(`/api/assignments/${assignmentId}/files`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get files metadata:', response.status, errorText);
        throw new Error(`Failed to get files metadata: ${response.status}`);
      }
      
      const allFiles = await response.json();
      console.log('All files received for download:', allFiles);
      
      if (allFiles.length === 0) {
        toast({
          title: "No Files",
          description: "No files available to download",
          variant: "destructive",
        });
        return;
      }

      // Download each file individually with proper names
      let downloadedCount = 0;
      let failedCount = 0;
      
      for (const file of allFiles) {
        try {
          console.log('Downloading file:', file.downloadName || file.name);
          const downloadResponse = await fetch(file.downloadUrl, {
            credentials: 'include',
          });
          
          if (downloadResponse.ok) {
            const blob = await downloadResponse.blob();
            console.log('Downloaded blob size:', blob.size, 'type:', blob.type);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.downloadName || file.name;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            downloadedCount++;
            
            // Small delay between downloads to avoid overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            const errorText = await downloadResponse.text();
            console.error(`Failed to download ${file.downloadName}:`, downloadResponse.status, errorText);
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to download file ${file.downloadName}:`, error);
          failedCount++;
        }
      }

      if (downloadedCount > 0) {
        toast({
          title: "Downloaded",
          description: `Downloaded ${downloadedCount} files${failedCount > 0 ? `, ${failedCount} failed` : ''} with original formats`,
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download any files",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Download all error:', error);
      toast({
        title: "Download Failed",
        description: `Failed to download submissions: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (classroomLoading) {
    return (
      <div className="min-h-screen bg-background-page">
        <Navigation 
          showBackButton={true}
          backHref="/"
          backLabel="Dashboard"
          pageTitle="Loading..."
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-background-page">
        <Navigation 
          showBackButton={true}
          backHref="/"
          backLabel="Dashboard"
          pageTitle="Not Found"
        />
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Classroom not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-page">
      <Navigation 
        showBackButton={true}
        backHref="/"
        backLabel="Dashboard"
        breadcrumbs={[
          { label: "Classrooms" },
          { label: classroom.name }
        ]}
      />

      {/* Page Header with Class Info */}
      <div className="bg-surface shadow-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-medium text-foreground">{classroom.name}</h2>
              {classroom.description && (
                <p className="text-muted-foreground mt-1">{classroom.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {classroom.section && (
                <Badge variant="secondary">{classroom.section}</Badge>
              )}
              {classroom.grade && (
                <Badge variant="outline">{classroom.grade}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-6">
            {/* Assignments List */}
            <Card className="bg-surface shadow-material">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Assignments</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search assignments..." 
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                {classroom.assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assignments found for this classroom.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classroom.assignments.map((assignment) => (
                      <Card 
                        key={assignment.id} 
                        className={`border transition-all cursor-pointer ${
                          selectedAssignment?.id === assignment.id 
                            ? 'border-primary shadow-md' 
                            : 'border-border hover:shadow-material'
                        }`}
                        onClick={() => handleAssignmentSelection(assignment)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground mb-1">{assignment.title}</h4>
                              {assignment.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {assignment.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                {assignment.maxPoints && (
                                  <span>Max: {assignment.maxPoints} points</span>
                                )}
                                {assignment.dueDate && (
                                  <span className="flex items-center">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAssignment(assignment);
                                  setShowCriteriaDialog(true);
                                }}
                              >
                                Set Criteria
                              </Button>
                              <Button 
                                variant={selectedAssignment?.id === assignment.id ? "default" : "outline"}
                                size="sm"
                              >
                                View Submissions
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Submissions for Selected Assignment */}
            {selectedAssignment && (
              <Card className="bg-surface shadow-material">
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">
                        "{selectedAssignment.title}"
                      </h3>
                      <div className="flex space-x-4 mt-1">
                        <Badge variant="outline" className="text-muted-foreground">
                          {submissions.filter(s => s.isGraded).length} / {submissions.length} graded
                        </Badge>
                        <Badge variant="secondary" className="text-muted-foreground">
                          {submissions.filter(s => s.status === 'pending').length} pending
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAllSubmissions(selectedAssignment.id)}
                        disabled={!submissions.length || downloadingAll}
                        className="text-xs"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {downloadingAll ? 'Downloading...' : 'Download All'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOverallResults(true)}
                        disabled={!submissions.some(s => s.isGraded)}
                        className="text-xs"
                      >
                        Overall Results
                      </Button>
                      <Button
                        onClick={() => gradeAllSubmissions(selectedAssignment.id)}
                        disabled={!hasGradingCriteria || gradingAll || submissions.every(s => s.isGraded || s.status === 'pending')}
                        size="sm"
                        className="bg-primary hover:bg-primary-dark text-primary-foreground text-xs"
                      >
                        <Brain className="mr-1 h-3 w-3" />
                        {gradingAll ? 'Grading All...' : 'Grade All Submissions'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Tabs for Submissions and Results */}
                <div className="px-6 py-2 border-b border-border">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="submissions">Submissions</TabsTrigger>
                      <TabsTrigger value="results" disabled={!submissions.some(s => s.isGraded)}>Results</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="p-6">
                  {activeTab === 'submissions' && (
                    <>
                      {!hasGradingCriteria && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-6 rounded-md">
                      <p className="font-medium">
                        <AlertCircle className="inline-block w-4 h-4 mr-2" />
                        No grading criteria set for this assignment.
                      </p>
                      <p className="text-sm mt-1">
                        Please add grading criteria before grading submissions.
                      </p>
                      {/* Link to create/edit grading criteria would go here */}
                    </div>
                  )}

                  {submissionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading submissions...</p>
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No submissions found for this assignment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((submission) => (
                        <Card key={submission.id} className="border border-border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {submission.student.profileImageUrl ? (
                                  <img 
                                    src={submission.student.profileImageUrl} 
                                    alt={submission.student.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary font-medium">
                                      {submission.student.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <h5 className="font-medium text-foreground">{submission.student.name}</h5>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    {submission.attachedFiles?.length ? (
                                      <span>{submission.attachedFiles.length} file{submission.attachedFiles.length > 1 ? 's' : ''}</span>
                                    ) : submission.fileName && (
                                      <span>{submission.fileName}</span>
                                    )}
                                    {submission.submittedAt && (
                                      <span>
                                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                {submission.status === 'pending' ? (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Pending
                                  </Badge>
                                ) : submission.isGraded ? (
                                  <>
                                    <Badge className="bg-accent/10 text-accent">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Graded
                                    </Badge>
                                    {submission.grade && (
                                      <span className="text-sm font-medium">
                                        {submission.grade.totalScore}/{submission.grade.maxScore}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="border-warning text-warning">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Pending
                                  </Badge>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() => openPreviewModal(submission)}
                                  disabled={!submission.attachedFiles?.length && !submission.fileUrl}
                                  data-testid={`button-preview-${submission.id}`}
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  Preview {submission.attachedFiles?.length > 1 ? `(${submission.attachedFiles.length})` : ''}
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={async () => {
                                    try {
                                      // Get files for this specific submission
                                      const response = await fetch(`/api/submissions/${submission.id}/files`, {
                                        credentials: 'include',
                                      });
                                      
                                      if (!response.ok) {
                                        const errorText = await response.text();
                                        console.error('Failed to get submission files:', response.status, errorText);
                                        throw new Error(`Failed to get files: ${response.status}`);
                                      }
                                      
                                      const files = await response.json();
                                      console.log('Individual submission files:', files);
                                      
                                      if (files.length === 0) {
                                        toast({
                                          title: "No Files",
                                          description: "No files available to download",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      // Download all files for this submission
                                      let downloadedCount = 0;
                                      let failedCount = 0;
                                      
                                      for (const file of files) {
                                        try {
                                          console.log('Downloading individual file:', file.name);
                                          const downloadResponse = await fetch(file.downloadUrl, {
                                            credentials: 'include',
                                          });
                                          
                                          if (downloadResponse.ok) {
                                            const blob = await downloadResponse.blob();
                                            console.log('Individual file blob size:', blob.size, 'type:', blob.type);
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = file.name;
                                            a.style.display = 'none';
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                            downloadedCount++;
                                            
                                            await new Promise(resolve => setTimeout(resolve, 100));
                                          } else {
                                            const errorText = await downloadResponse.text();
                                            console.error(`Failed to download ${file.name}:`, downloadResponse.status, errorText);
                                            failedCount++;
                                          }
                                        } catch (error) {
                                          console.error(`Failed to download ${file.name}:`, error);
                                          failedCount++;
                                        }
                                      }
                                      
                                      if (downloadedCount > 0) {
                                        toast({
                                          title: "Downloaded",
                                          description: `Downloaded ${downloadedCount} files for ${submission.student.name}${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
                                        });
                                      } else {
                                        toast({
                                          title: "Download Failed",
                                          description: "Failed to download files",
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Individual download error:', error);
                                      toast({
                                        title: "Download Failed",
                                        description: `Failed to download submission files: ${error.message}`,
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  disabled={!submission.attachedFiles?.length && !submission.fileUrl}
                                  data-testid={`button-download-${submission.id}`}
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Download {submission.attachedFiles?.length > 1 ? `(${submission.attachedFiles.length})` : ''}
                                </Button>

                                <Button
                                  onClick={() => openGradingModal(submission)}
                                  size="sm"
                                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                                  disabled={!hasGradingCriteria}
                                  data-testid={`button-grade-${submission.id}`}
                                >
                                  {submission.isGraded ? 'Review Grade' : 'Grade'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                    </>
                  )}
                  
                  {/* Results Tab Content */}
                  {activeTab === 'results' && (
                    <ResultsAnalytics 
                      submissions={submissions}
                      assignmentTitle={selectedAssignment.title}
                      maxPoints={selectedAssignment.maxPoints}
                      onSaveResults={() => {
                        toast({
                          title: "Results Saved",
                          description: "Assignment results have been saved successfully",
                        });
                      }}
                    />
                  )}
                </div>
              </Card>
            )}

            {/* Overall Results Modal */}
            <OverallResultsModal
              isOpen={showOverallResults}
              onClose={() => setShowOverallResults(false)}
              submissions={submissions}
              assignmentTitle={selectedAssignment?.title || ''}
              maxPoints={selectedAssignment?.maxPoints}
            />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card className="bg-surface shadow-material">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">Students</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search students..." 
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                {classroom.students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No students found in this classroom.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classroom.students.map((student) => (
                      <Card key={student.id} className="border border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            {student.profileImageUrl ? (
                              <img 
                                src={student.profileImageUrl} 
                                alt={student.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium text-lg">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{student.name}</h4>
                              {student.email && (
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && selectedAssignment && (
        <GradingModal
          submission={selectedSubmission}
          assignment={selectedAssignment}
          isOpen={isGradingModalOpen}
          onClose={closeGradingModal}
          queryClient={queryClient}
        />
      )}

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={closePreviewModal}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Preview: {selectedFiles[selectedFileIndex]?.name || 'File'}
              {selectedFiles.length > 1 && ` (${selectedFileIndex + 1}/${selectedFiles.length})`}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="outline" className="absolute top-4 right-4 h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          {/* File selector for multiple files */}
          {selectedFiles.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4 p-4 bg-muted rounded-lg">
              {selectedFiles.map((file, index) => (
                <Button
                  key={file.id}
                  variant={index === selectedFileIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchPreviewFile(index)}
                >
                  {file.name}
                </Button>
              ))}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {previewFileUrl ? (
              <iframe
                src={previewFileUrl}
                className="w-full h-full border-0"
                title="File Preview"
              />
            ) : (
              <p className="text-muted-foreground">Could not load preview.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Criteria Setup Dialog */}
      <CriteriaSetupDialog
        assignment={selectedAssignment}
        isOpen={showCriteriaDialog}
        onClose={() => {
          setShowCriteriaDialog(false);
          setSelectedAssignment(null);
        }}
        queryClient={queryClient}
      />
    </div>
  );
}

// Criteria Setup Component
function CriteriaSetupDialog({ 
  assignment, 
  isOpen, 
  onClose, 
  queryClient 
}: { 
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  queryClient: any;
}) {
  const { toast } = useToast();
  const [newCriteria, setNewCriteria] = useState<Array<{name: string, description: string, maxPoints: number, weight: number}>>([
    { name: "", description: "", maxPoints: 10, weight: 25 }
  ]);

  const { data: existingCriteria = [], isLoading } = useQuery<GradingCriterion[]>({
    queryKey: ["/api/assignments", assignment?.id, "criteria"],
    enabled: isOpen && !!assignment?.id,
  });

  // Load existing criteria when dialog opens
  useEffect(() => {
    if (existingCriteria.length > 0) {
      setNewCriteria(existingCriteria.map(c => ({
        name: c.name,
        description: c.description || '',
        maxPoints: c.maxScore,
        weight: c.weight || 25
      })));
    }
  }, [existingCriteria]);

  const setCriteriaMutation = useMutation({
    mutationFn: async (criteriaData: any[]) => {
      const response = await fetch(`/api/assignments/${assignment?.id}/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: criteriaData }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to set criteria');
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both criteria query and classroom query to refresh assignment data
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", assignment?.id, "criteria"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({
        title: "Success",
        description: "Grading criteria have been set successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set grading criteria",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const validCriteria = newCriteria.filter(c => c.name.trim());
    if (validCriteria.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one criterion with a name",
        variant: "destructive",
      });
      return;
    }
    setCriteriaMutation.mutate(validCriteria);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Set Grading Criteria - {assignment?.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Define the criteria that will be used to grade submissions for this assignment.
          </p>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {newCriteria.map((criterion, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Criterion {index + 1}</h4>
                      {newCriteria.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewCriteria(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={criterion.name}
                          onChange={(e) => {
                            setNewCriteria(prev => prev.map((c, i) => 
                              i === index ? { ...c, name: e.target.value } : c
                            ));
                          }}
                          placeholder="e.g., Code Quality"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Points</label>
                        <Input
                          type="number"
                          value={criterion.maxPoints}
                          onChange={(e) => {
                            setNewCriteria(prev => prev.map((c, i) => 
                              i === index ? { ...c, maxPoints: parseInt(e.target.value) || 0 } : c
                            ));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={criterion.description}
                        onChange={(e) => {
                          setNewCriteria(prev => prev.map((c, i) => 
                            i === index ? { ...c, description: e.target.value } : c
                          ));
                        }}
                        placeholder="Describe what this criterion evaluates..."
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewCriteria(prev => [...prev, { name: "", description: "", maxPoints: 10, weight: 25 }]);
                }}
              >
                Add Another Criterion
              </Button>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={setCriteriaMutation.isPending}
                >
                  {setCriteriaMutation.isPending ? 'Saving...' : 'Save Criteria'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}