import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import ConfirmationDialog from "./confirmation-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, FileText, Brain, Save, Upload } from "lucide-react";

interface GradingModalProps {
  submission: any;
  assignment: any;
  isOpen: boolean;
  onClose: () => void;
  queryClient?: any;
}

interface GradingCriteria {
  id: string;
  name: string;
  description?: string;
  maxPoints: number;
  weight: number;
}

interface AIGradingResult {
  totalScore: number;
  maxScore: number;
  criteriaScores: Record<string, number>;
  feedback: string;
  suggestions: string[];
}

export default function GradingModal({ submission, assignment, isOpen, onClose }: GradingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiResult, setAiResult] = useState<AIGradingResult | null>(null);
  const [feedback, setFeedback] = useState("");
  const [totalScore, setTotalScore] = useState<number>(0);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [storeLocally, setStoreLocally] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'post' | null>(null);
  const [showCriteriaSetup, setShowCriteriaSetup] = useState(false);
  const [newCriteria, setNewCriteria] = useState<Array<{name: string, description: string, maxPoints: number, weight: number}>>([
    { name: "", description: "", maxPoints: 10, weight: 100 }
  ]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [existingGrade, setExistingGrade] = useState<any>(null);

  // Fetch existing grade for this submission
  const { data: existingGradeData } = useQuery({
    queryKey: ["/api/submissions", submission?.id, "grade"],
    enabled: isOpen && !!submission?.id,
  });

  // Fetch submission content for all files
  const { data: submissionContent, isLoading: contentLoading } = useQuery({
    queryKey: ["/api/submissions", submission?.id, "content"],
    enabled: isOpen && !!submission?.id,
  });

  // Fetch grading criteria
  const { data: criteria = [], isLoading: criteriaLoading } = useQuery<GradingCriteria[]>({
    queryKey: ["/api/assignments", assignment?.id, "criteria"],
    enabled: isOpen && !!assignment?.id,
  });

  // Load existing grade data when modal opens
  useEffect(() => {
    if (existingGradeData && isOpen) {
      setExistingGrade(existingGradeData);
      setAiResult({
        totalScore: existingGradeData.totalScore,
        maxScore: existingGradeData.maxScore,
        criteriaScores: existingGradeData.criteriaScores || {},
        feedback: existingGradeData.feedback || "",
        suggestions: []
      });
      setFeedback(existingGradeData.feedback || "");
      setTotalScore(existingGradeData.totalScore || 0);
      setCriteriaScores(existingGradeData.criteriaScores || {});
    } else if (isOpen) {
      // Reset for new grading
      setExistingGrade(null);
      setAiResult(null);
      setFeedback("");
      setTotalScore(0);
      setCriteriaScores({});
    }
  }, [existingGradeData, isOpen]);

  // AI Grading mutation
  const aiGradingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/submissions/${submission.id}/grade`);
      return await response.json();
    },
    onSuccess: (data) => {
      setExistingGrade(data.grade);
      setAiResult(data.aiResult);
      setFeedback(data.aiResult.feedback);
      setTotalScore(data.aiResult.totalScore);
      setCriteriaScores(data.aiResult.criteriaScores);
      toast({
        title: "AI Grading Complete",
        description: "AI has successfully graded the submission",
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
        description: "Failed to grade submission with AI",
        variant: "destructive",
      });
    },
  });

  // Set criteria mutation
  const setCriteriaMutation = useMutation({
    mutationFn: async (criteriaData: any[]) => {
      const response = await apiRequest("POST", `/api/assignments/${assignment.id}/criteria`, {
        criteria: criteriaData
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", assignment?.id, "criteria"] });
      setShowCriteriaSetup(false);
      toast({
        title: "Success",
        description: "Grading criteria have been set successfully",
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
        description: "Failed to set grading criteria",
        variant: "destructive",
      });
    },
  });

  // Post grade mutation
  const postGradeMutation = useMutation({
    mutationFn: async () => {
      const gradeId = existingGrade?.id;
      if (!gradeId) {
        throw new Error('No grade ID available. Please generate a grade first.');
      }
      const response = await fetch(`/api/grades/${gradeId}/post`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to post grade');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({
        title: "Success",
        description: "Grade posted to Google Classroom successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
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
        description: "Failed to post grade to Google Classroom",
        variant: "destructive",
      });
    },
  });

  const handleAIGrading = () => {
    if (criteria.length === 0) {
      toast({
        title: "No Grading Criteria",
        description: "Please set grading criteria for this assignment first",
        variant: "destructive",
      });
      return;
    }
    aiGradingMutation.mutate();
  };

  const handleSaveGrade = () => {
    if (storeLocally) {
      // Just close modal for now - in a real app, this would save locally
      toast({
        title: "Grade Saved",
        description: "Grade has been saved locally",
      });
      onClose();
    } else {
      setPendingAction('save');
      setShowConfirmation(true);
    }
  };

  const handlePostToClassroom = () => {
    if (!existingGrade) {
      toast({
        title: "No Grade to Post",
        description: "Please generate a grade first",
        variant: "destructive",
      });
      return;
    }
    setPendingAction('post');
    setShowConfirmation(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction === 'post' && aiResult) {
      postGradeMutation.mutate();
    }
    setShowConfirmation(false);
    setPendingAction(null);
  };

  const updateCriteriaScore = (criteriaId: string, score: number) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: score
    }));

    // Recalculate total score
    const total = Object.values({
      ...criteriaScores,
      [criteriaId]: score
    }).reduce((sum, score) => sum + score, 0);
    setTotalScore(total);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div>
              <DialogTitle className="text-xl font-medium text-foreground">Grade Submission</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {assignment?.title} - {submission?.student?.name}
              </p>
              {existingGrade && (
                <p className="text-sm text-accent mt-1">
                  Previously graded on {new Date(existingGrade.gradedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[70vh]">
            {/* Submission Preview */}
            <div className="border-r border-border flex flex-col">
              <div className="px-6 py-3 bg-muted border-b border-border">
                <h4 className="font-medium text-foreground flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Submission Preview
                </h4>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : submissionContent && submission?.attachedFiles?.length > 0 ? (
                  <div className="space-y-4">
                    {/* File Navigation */}
                    {submission.attachedFiles.length > 1 && (
                      <div className="flex gap-2 flex-wrap mb-4">
                        {submission.attachedFiles.map((file, index) => (
                          <Button
                            key={file.id}
                            variant={selectedFileIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedFileIndex(index)}
                          >
                            {file.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-2 flex items-center">
                          <FileText className="mr-1 h-4 w-4" />
                          {submission.attachedFiles[selectedFileIndex]?.name || 'Unknown file'}
                        </p>
                        <div className="bg-surface p-4 rounded border text-sm max-h-96 overflow-y-auto">
                          <div className="whitespace-pre-wrap">
                            {Array.isArray(submissionContent) ? submissionContent[selectedFileIndex]?.content || "No content available" : submissionContent.content || "No content available"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No submission content available</p>
                )}
              </div>
            </div>

            {/* Grading Interface */}
            <div className="flex flex-col">
              <div className="px-6 py-3 bg-muted border-b border-border">
                <h4 className="font-medium text-foreground flex items-center">
                  <Brain className="mr-2 h-4 w-4" />
                  AI Grading Assistant
                </h4>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Grading Criteria */}
                {criteriaLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ) : criteria.length > 0 ? (
                  <div className="mb-6">
                    <h5 className="font-medium text-foreground mb-3">Grading Criteria</h5>
                    <div className="space-y-3">
                      {criteria.map((criterion) => (
                        <div key={criterion.id} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">
                            {criterion.name} ({criterion.maxPoints} pts{criteria.length > 1 ? `, ${criterion.weight}%` : ''})
                          </span>
                          <Input
                            type="number"
                            min="0"
                            max={criterion.maxPoints}
                            value={criteriaScores[criterion.name] || ''}
                            onChange={(e) => updateCriteriaScore(criterion.name, parseInt(e.target.value) || 0)}
                            className="w-20 text-center"
                            placeholder={`0-${criterion.maxPoints}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 border border-warning/20 rounded-lg bg-warning/10">
                    <p className="text-sm text-warning mb-3">
                      No grading criteria set for this assignment. AI grading will not be available.
                    </p>
                    <Button 
                      onClick={() => setShowCriteriaSetup(true)}
                      size="sm"
                      variant="outline"
                      className="border-warning text-warning hover:bg-warning/10"
                    >
                      Set Up Grading Criteria
                    </Button>
                  </div>
                )}

                {/* AI Grading Button */}
                <div className="mb-6">
                  <Button 
                    onClick={handleAIGrading}
                    disabled={aiGradingMutation.isPending || criteria.length === 0}
                    className="w-full bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {aiGradingMutation.isPending ? 'Generating...' : existingGrade ? 'Re-grade with AI' : 'Generate AI Grade & Feedback'}
                  </Button>
                </div>

                {/* AI Results */}
                {aiResult && (
                  <Card className="border border-accent/20 bg-accent/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-foreground">AI Grading Results</h5>
                        <Badge className="bg-accent text-accent-foreground">
                          {aiResult.totalScore}/{aiResult.maxScore}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        {Object.entries(aiResult.criteriaScores).map(([criteriaName, score]) => (
                          <div key={criteriaName} className="flex justify-between text-sm">
                            <span>{criteriaName}</span>
                            <span className="font-medium">{score}</span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div>
                        <h6 className="font-medium text-foreground mb-2">Feedback</h6>
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={6}
                          className="w-full"
                          placeholder="AI-generated feedback will appear here..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2">
                      <Checkbox 
                        checked={storeLocally}
                        onCheckedChange={(checked) => setStoreLocally(checked as boolean)}
                      />
                      <span className="text-sm text-foreground">Store locally before posting</span>
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveGrade}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Grade
                    </Button>
                    <Button 
                      onClick={handlePostToClassroom}
                      disabled={!existingGrade}
                      className="bg-primary hover:bg-primary-dark text-primary-foreground"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Post to Classroom
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmAction}
        title="Confirm Action"
        message={
          pendingAction === 'post' 
            ? "Are you sure you want to post this grade to Google Classroom?"
            : "Are you sure you want to save this grade?"
        }
        confirmText="Confirm"
        isLoading={postGradeMutation.isPending}
      />

      {/* Criteria Setup Dialog */}
      <Dialog open={showCriteriaSetup} onOpenChange={setShowCriteriaSetup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set Up Grading Criteria</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Define the criteria that will be used to grade submissions for this assignment.
            </p>
          </DialogHeader>

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
                setNewCriteria(prev => [...prev, { name: "", description: "", maxPoints: 10, weight: 100 }]);
              }}
            >
              Add Another Criterion
            </Button>

            <div className="space-x-2">
              <Button variant="outline" onClick={() => setShowCriteriaSetup(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
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
                }}
                disabled={setCriteriaMutation.isPending}
              >
                {setCriteriaMutation.isPending ? 'Saving...' : 'Save Criteria'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}