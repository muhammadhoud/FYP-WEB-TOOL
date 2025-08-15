import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Users,
  FileText,
  Brain,
  X 
} from "lucide-react";
import { useState } from "react";

interface Submission {
  id: string;
  student: { name: string; email?: string };
  isGraded: boolean;
  grade?: {
    totalScore: number;
    maxScore: number;
    feedback?: string;
    criteriaScores?: Record<string, number>;
  };
}

interface OverallResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: Submission[];
  assignmentTitle: string;
  maxPoints?: number;
}

export default function OverallResultsModal({
  isOpen,
  onClose,
  submissions,
  assignmentTitle,
  maxPoints = 100
}: OverallResultsModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const gradedSubmissions = submissions.filter(s => s.isGraded && s.grade);
  
  if (gradedSubmissions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Overall Results - {assignmentTitle}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No graded submissions available yet.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const scores = gradedSubmissions.map(s => ({
    studentName: s.student.name,
    score: s.grade!.totalScore,
    maxScore: s.grade!.maxScore,
    percentage: Math.round((s.grade!.totalScore / s.grade!.maxScore) * 100),
    feedback: s.grade!.feedback || '',
    criteriaScores: s.grade!.criteriaScores || {}
  }));

  scores.sort((a, b) => b.percentage - a.percentage);

  const percentages = scores.map(s => s.percentage);
  const average = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  const highest = Math.max(...percentages);
  const lowest = Math.min(...percentages);

  const exportResults = () => {
    const csvContent = [
      ['Student Name', 'Score', 'Max Score', 'Percentage', 'Letter Grade', 'Feedback'],
      ...scores.map(s => [
        s.studentName,
        s.score,
        s.maxScore,
        `${s.percentage}%`,
        getLetterGrade(s.percentage),
        `"${s.feedback.replace(/"/g, '""')}"`
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assignmentTitle}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedStudentData = selectedStudent 
    ? scores.find(s => s.studentName === selectedStudent)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Overall Results - {assignmentTitle}</DialogTitle>
            <Button onClick={exportResults} variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Left Panel - Statistics */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Class Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">Students Graded</span>
                  </div>
                  <Badge variant="secondary">{gradedSubmissions.length}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Class Average</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">{average}%</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Highest Score</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{highest}%</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Lowest Score</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">{lowest}%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D', 'F'].map(grade => {
                    const count = scores.filter(s => getLetterGrade(s.percentage) === grade).length;
                    const percentage = Math.round((count / scores.length) * 100);
                    return (
                      <div key={grade} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{grade}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Panel - Student List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Student Rankings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {scores.map((student, index) => (
                    <div
                      key={student.studentName}
                      className={`p-3 border-b border-border cursor-pointer transition-colors ${
                        selectedStudent === student.studentName 
                          ? 'bg-primary/10' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedStudent(student.studentName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.score}/{student.maxScore} points
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              student.percentage >= 90 ? "default" :
                              student.percentage >= 80 ? "secondary" :
                              student.percentage >= 70 ? "outline" : "destructive"
                            }
                            className="text-xs"
                          >
                            {student.percentage}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getLetterGrade(student.percentage)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Student Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Brain className="mr-2 h-4 w-4" />
                  {selectedStudentData ? `${selectedStudentData.studentName}'s Details` : 'Select a Student'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStudentData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Score</p>
                        <p className="text-lg font-bold">
                          {selectedStudentData.score}/{selectedStudentData.maxScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Percentage</p>
                        <p className="text-lg font-bold">{selectedStudentData.percentage}%</p>
                      </div>
                    </div>

                    {Object.keys(selectedStudentData.criteriaScores).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Criteria Breakdown</p>
                        <div className="space-y-2">
                          {Object.entries(selectedStudentData.criteriaScores).map(([criteria, score]) => (
                            <div key={criteria} className="flex justify-between text-sm">
                              <span>{criteria}</span>
                              <span className="font-medium">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStudentData.feedback && (
                      <div>
                        <p className="text-sm font-medium mb-2">AI Feedback</p>
                        <Textarea
                          value={selectedStudentData.feedback}
                          readOnly
                          className="min-h-32 text-sm resize-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      Click on a student to view their detailed results and feedback
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}