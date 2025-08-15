import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, Award, Users, FileText, Save } from "lucide-react";

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

interface ResultsAnalyticsProps {
  submissions: Submission[];
  assignmentTitle: string;
  maxPoints?: number;
  onSaveResults?: () => void;
}

export default function ResultsAnalytics({ 
  submissions, 
  assignmentTitle, 
  maxPoints = 100,
  onSaveResults 
}: ResultsAnalyticsProps) {
  const analytics = useMemo(() => {
    const gradedSubmissions = submissions.filter(s => s.isGraded && s.grade);
    
    if (gradedSubmissions.length === 0) {
      return null;
    }

    const scores = gradedSubmissions.map(s => {
      const percentage = (s.grade!.totalScore / s.grade!.maxScore) * 100;
      return {
        studentName: s.student.name,
        score: s.grade!.totalScore,
        maxScore: s.grade!.maxScore,
        percentage: Math.round(percentage * 10) / 10,
        grade: getLetterGrade(percentage)
      };
    });

    scores.sort((a, b) => b.percentage - a.percentage);

    const percentages = scores.map(s => s.percentage);
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const median = getMedian(percentages);
    const min = Math.min(...percentages);
    const max = Math.max(...percentages);
    const stdDev = getStandardDeviation(percentages, average);

    // Outliers (scores more than 1.5 * IQR away from Q1 or Q3)
    const q1 = getPercentile(percentages, 25);
    const q3 = getPercentile(percentages, 75);
    const iqr = q3 - q1;
    const outliers = scores.filter(s => 
      s.percentage < (q1 - 1.5 * iqr) || s.percentage > (q3 + 1.5 * iqr)
    );

    // Grade distribution
    const gradeDistribution = {
      'A (90-100%)': scores.filter(s => s.percentage >= 90).length,
      'B (80-89%)': scores.filter(s => s.percentage >= 80 && s.percentage < 90).length,
      'C (70-79%)': scores.filter(s => s.percentage >= 70 && s.percentage < 80).length,
      'D (60-69%)': scores.filter(s => s.percentage >= 60 && s.percentage < 70).length,
      'F (0-59%)': scores.filter(s => s.percentage < 60).length,
    };

    // Score ranges for histogram
    const ranges = Array.from({ length: 10 }, (_, i) => {
      const start = i * 10;
      const end = start + 10;
      const count = scores.filter(s => s.percentage >= start && s.percentage < end).length;
      return {
        range: `${start}-${end}%`,
        count,
        percentage: Math.round((count / scores.length) * 100)
      };
    });

    return {
      scores,
      average: Math.round(average * 10) / 10,
      median: Math.round(median * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      outliers,
      gradeDistribution,
      ranges,
      totalGraded: gradedSubmissions.length,
      totalSubmissions: submissions.length
    };
  }, [submissions]);

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No graded submissions available for analysis.</p>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Results Analysis - {assignmentTitle}
        </h3>
        <Button onClick={onSaveResults} variant="outline" size="sm">
          <Save className="mr-1 h-4 w-4" />
          Save Results
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalGraded}</p>
                <p className="text-xs text-muted-foreground">Graded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.average}%</p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.max}%</p>
                <p className="text-xs text-muted-foreground">Highest</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{analytics.min}%</p>
                <p className="text-xs text-muted-foreground">Lowest</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistical Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Median</p>
              <p className="text-muted-foreground">{analytics.median}%</p>
            </div>
            <div>
              <p className="font-medium">Std. Deviation</p>
              <p className="text-muted-foreground">{analytics.stdDev}%</p>
            </div>
            <div>
              <p className="font-medium">Outliers</p>
              <p className="text-muted-foreground">{analytics.outliers.length} students</p>
            </div>
            <div>
              <p className="font-medium">Completion Rate</p>
              <p className="text-muted-foreground">
                {Math.round((analytics.totalGraded / analytics.totalSubmissions) * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics.gradeDistribution)
                    .filter(([, count]) => count > 0)
                    .map(([grade, count]) => ({ grade, count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="count"
                  label={({ grade, count }) => `${grade.split(' ')[0]}: ${count}`}
                >
                  {Object.entries(analytics.gradeDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.ranges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Individual Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analytics.scores.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{result.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.score} / {result.maxScore} points
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      result.percentage >= 90 ? "default" :
                      result.percentage >= 80 ? "secondary" :
                      result.percentage >= 70 ? "outline" : "destructive"
                    }
                  >
                    {result.percentage}%
                  </Badge>
                  <Badge variant="outline">
                    {result.grade}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outliers */}
      {analytics.outliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outliers (Exceptional Performances)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.outliers.map((outlier, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{outlier.studentName}</span>
                  <Badge variant={outlier.percentage >= analytics.average ? "default" : "destructive"}>
                    {outlier.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function getMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

function getPercentile(numbers: number[], percentile: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) return sorted[lower];
  
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function getStandardDeviation(numbers: number[], mean: number): number {
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}