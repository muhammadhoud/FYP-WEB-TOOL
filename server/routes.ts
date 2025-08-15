import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { googleClassroomService } from "./services/googleClassroom";
import { googleDriveService } from "./services/googleDrive";
import { gradeSubmission } from "./services/deepseek";
import { insertGradeSchema, insertGradingCriteriaSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const classrooms = await storage.getClassrooms(userId);

      let totalStudents = 0;
      let pendingSubmissions = 0;
      let gradedToday = 0;
      let totalAssignments = 0;

      for (const classroom of classrooms) {
        const students = await storage.getStudents(classroom.id);
        totalStudents += students.length;

        const assignments = await storage.getAssignments(classroom.id);
        totalAssignments += assignments.length;
        
        for (const assignment of assignments) {
          const submissions = await storage.getSubmissions(assignment.id);
          pendingSubmissions += submissions.filter(s => !s.isGraded).length;

          const grades = await storage.getGrades(assignment.id);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          gradedToday += grades.filter(g => g.gradedAt && g.gradedAt >= today).length;
        }
      }

      res.json({
        classrooms: classrooms.length,
        students: totalStudents,
        assignments: totalAssignments,
        pendingSubmissions,
        gradedToday,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Dashboard analytics
  app.get('/api/dashboard/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const classrooms = await storage.getClassrooms(userId);

      // Grading trends over the last 7 days
      const gradingTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        let gradedCount = 0;
        for (const classroom of classrooms) {
          const assignments = await storage.getAssignments(classroom.id);
          for (const assignment of assignments) {
            const grades = await storage.getGrades(assignment.id);
            gradedCount += grades.filter(g => 
              g.gradedAt && g.gradedAt >= date && g.gradedAt < nextDay
            ).length;
          }
        }

        gradingTrends.push({
          date: date.toISOString().split('T')[0],
          graded: gradedCount
        });
      }

      // Grade distribution
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      let totalScores = [];

      // Classroom performance comparison
      const classroomStats = [];

      for (const classroom of classrooms) {
        const students = await storage.getStudents(classroom.id);
        const assignments = await storage.getAssignments(classroom.id);
        
        let classroomTotalGrades = 0;
        let classroomPendingSubmissions = 0;
        let classroomTotalScore = 0;
        let classroomGradedSubmissions = 0;

        for (const assignment of assignments) {
          const submissions = await storage.getSubmissions(assignment.id);
          const grades = await storage.getGrades(assignment.id);
          
          classroomTotalGrades += grades.length;
          classroomPendingSubmissions += submissions.filter(s => !s.isGraded).length;

          for (const grade of grades) {
            if (grade.totalScore && grade.maxScore) {
              const percentage = (grade.totalScore / grade.maxScore) * 100;
              totalScores.push(percentage);
              classroomTotalScore += percentage;
              classroomGradedSubmissions++;

              // Grade distribution
              if (percentage >= 90) gradeDistribution.A++;
              else if (percentage >= 80) gradeDistribution.B++;
              else if (percentage >= 70) gradeDistribution.C++;
              else if (percentage >= 60) gradeDistribution.D++;
              else gradeDistribution.F++;
            }
          }
        }

        classroomStats.push({
          id: classroom.id,
          name: classroom.name,
          students: students.length,
          assignments: assignments.length,
          totalGrades: classroomTotalGrades,
          pendingSubmissions: classroomPendingSubmissions,
          averageScore: classroomGradedSubmissions > 0 ? Math.round(classroomTotalScore / classroomGradedSubmissions) : 0,
          completionRate: assignments.length > 0 ? Math.round((classroomTotalGrades / (assignments.length * students.length)) * 100) : 0
        });
      }

      // Assignment difficulty analysis
      const assignmentAnalytics = [];
      for (const classroom of classrooms) {
        const assignments = await storage.getAssignments(classroom.id);
        for (const assignment of assignments) {
          const grades = await storage.getGrades(assignment.id);
          const submissions = await storage.getSubmissions(assignment.id);
          
          if (grades.length > 0) {
            const scores = grades
              .filter(g => g.totalScore && g.maxScore)
              .map(g => (g.totalScore! / g.maxScore!) * 100);
            
            const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            const submissionRate = submissions.length > 0 ? (grades.length / submissions.length) * 100 : 0;
            
            assignmentAnalytics.push({
              id: assignment.id,
              title: assignment.title,
              classroomName: classroom.name,
              averageScore: Math.round(averageScore),
              submissionRate: Math.round(submissionRate),
              totalSubmissions: submissions.length,
              gradedSubmissions: grades.length,
              maxPoints: assignment.maxPoints || 100
            });
          }
        }
      }

      res.json({
        gradingTrends,
        gradeDistribution,
        classroomStats,
        assignmentAnalytics: assignmentAnalytics.slice(0, 10), // Top 10 assignments
        totalGrades: totalScores.length,
        averageScore: totalScores.length > 0 ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length) : 0
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
  });

  // Assignment analytics
  app.get('/api/assignments/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const submissions = await storage.getSubmissions(assignmentId);
      const grades = await storage.getGrades(assignmentId);
      const gradingCriteria = await storage.getGradingCriteria(assignmentId);

      // Score distribution
      const scoreRanges = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '0-59': 0 };
      const scores = grades
        .filter(g => g.totalScore && g.maxScore)
        .map(g => (g.totalScore! / g.maxScore!) * 100);

      scores.forEach(score => {
        if (score >= 90) scoreRanges['90-100']++;
        else if (score >= 80) scoreRanges['80-89']++;
        else if (score >= 70) scoreRanges['70-79']++;
        else if (score >= 60) scoreRanges['60-69']++;
        else scoreRanges['0-59']++;
      });

      // Criteria performance
      const criteriaPerformance = gradingCriteria.map(criteria => {
        const criteriaScores = grades
          .filter(g => g.criteriaScores)
          .map(g => {
            const criteriaScore = (g.criteriaScores as any)?.[criteria.id];
            return criteriaScore ? (criteriaScore / criteria.maxPoints) * 100 : 0;
          })
          .filter(score => score > 0);

        return {
          id: criteria.id,
          name: criteria.name,
          averageScore: criteriaScores.length > 0 ? 
            Math.round(criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length) : 0,
          maxPoints: criteria.maxPoints,
          weight: criteria.weight
        };
      });

      res.json({
        assignment: {
          id: assignment.id,
          title: assignment.title,
          maxPoints: assignment.maxPoints,
          dueDate: assignment.dueDate
        },
        statistics: {
          totalSubmissions: submissions.length,
          gradedSubmissions: grades.length,
          pendingSubmissions: submissions.filter(s => !s.isGraded).length,
          averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
          lowestScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0
        },
        scoreDistribution: Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count
        })),
        criteriaPerformance
      });
    } catch (error) {
      console.error("Error fetching assignment analytics:", error);
      res.status(500).json({ message: "Failed to fetch assignment analytics" });
    }
  });

  // Sync classrooms from Google Classroom
  app.post('/api/classrooms/sync', isAuthenticated, async (req: any, res) => {
    try {
      const accessToken = req.user.accessToken;
      const userId = req.user.id;

      const googleClassrooms = await googleClassroomService.getClassrooms(accessToken);

      const syncedClassrooms = [];
      for (const gc of googleClassrooms) {
        const classroom = await storage.upsertClassroom({
          id: gc.id,
          name: gc.name,
          section: gc.section,
          grade: gc.descriptionHeading,
          description: gc.description,
          teacherId: userId,
        });

        // Sync students
        const googleStudents = await googleClassroomService.getStudents(accessToken, gc.id);
        for (const gs of googleStudents) {
          await storage.upsertStudent({
            id: gs.userId,
            classroomId: gc.id,
            name: gs.profile?.name?.fullName || 'Unknown Student',
            email: gs.profile?.emailAddress,
            profileImageUrl: gs.profile?.photoUrl,
          });
        }

        // Sync assignments
        const googleAssignments = await googleClassroomService.getAssignments(accessToken, gc.id);
        for (const ga of googleAssignments) {
          await storage.upsertAssignment({
            id: ga.id,
            classroomId: gc.id,
            title: ga.title,
            description: ga.description,
            maxPoints: ga.maxPoints,
            dueDate: ga.dueDate ? new Date(ga.dueDate.year, ga.dueDate.month - 1, ga.dueDate.day) : null,
          });

          // Sync submissions
          const googleSubmissions = await googleClassroomService.getSubmissions(accessToken, gc.id, ga.id);
          for (const gs of googleSubmissions) {
            if (gs.state === 'TURNED_IN' && gs.assignmentSubmission?.attachments) {
              const files = gs.assignmentSubmission.attachments
                .filter(att => att.driveFile)
                .map(att => ({
                  id: att.driveFile.id,
                  name: att.driveFile.title
                }));

              const primaryFile = gs.assignmentSubmission.attachments[0];
              if (primaryFile?.driveFile) {
                await storage.upsertSubmission({
                  id: gs.id,
                  assignmentId: ga.id,
                  studentId: gs.userId,
                  classroomId: gc.id,
                  driveFileId: primaryFile.driveFile.id,
                  fileName: primaryFile.driveFile.title,
                  submittedAt: gs.updateTime ? new Date(gs.updateTime) : null,
                  isGraded: !!gs.assignedGrade,
                  attachedFiles: files,
                });
              }
            }
          }
        }

        syncedClassrooms.push(classroom);
      }

      res.json(syncedClassrooms);
    } catch (error) {
      console.error("Error syncing classrooms:", error);
      res.status(500).json({ message: "Failed to sync classrooms" });
    }
  });

  // Get classrooms
  app.get('/api/classrooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const classrooms = await storage.getClassrooms(userId);
      res.json(classrooms);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      res.status(500).json({ message: "Failed to fetch classrooms" });
    }
  });

  // Get classroom details
  app.get('/api/classrooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroom(req.params.id);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      const students = await storage.getStudents(classroom.id);
      const assignments = await storage.getAssignments(classroom.id);

      // Add grading criteria to each assignment
      const assignmentsWithCriteria = await Promise.all(
        assignments.map(async (assignment) => {
          const gradingCriteria = await storage.getGradingCriteria(assignment.id);
          return {
            ...assignment,
            gradingCriteria,
          };
        })
      );

      res.json({
        ...classroom,
        students,
        assignments: assignmentsWithCriteria,
      });
    } catch (error) {
      console.error("Error fetching classroom:", error);
      res.status(500).json({ message: "Failed to fetch classroom" });
    }
  });

  // Get submissions for assignment
  app.get('/api/assignments/:assignmentId/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const submissions = await storage.getSubmissions(req.params.assignmentId);

      const submissionsWithDetails = await Promise.all(
        submissions.map(async (submission) => {
          try {
            const student = await storage.getStudent(submission.studentId);
            const grade = await storage.getGrade(submission.id);
            
            // Ensure we have valid data before returning
            return {
              ...submission,
              student: student || { id: submission.studentId, name: 'Unknown Student', classroomId: '' },
              grade: grade || null,
              fileUrl: submission.driveFileId ? `/api/files/${submission.driveFileId}/preview` : null,
              attachedFiles: submission.attachedFiles || (submission.driveFileId ? [{ id: submission.driveFileId, name: submission.fileName || 'Untitled' }] : []),
            };
          } catch (submissionError) {
            console.error("Error processing submission:", submissionError);
            return {
              ...submission,
              student: { id: submission.studentId, name: 'Unknown Student', classroomId: '' },
              grade: null,
              fileUrl: null,
            };
          }
        })
      );

      res.json(submissionsWithDetails);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Get submission file content
  app.get('/api/submissions/:submissionId/content', isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmission(req.params.submissionId);
      if (!submission?.driveFileId) {
        return res.status(404).json({ message: "Submission or file not found" });
      }

      const accessToken = req.user.accessToken;
      
      // Handle multiple files if they exist
      if (submission.attachedFiles && submission.attachedFiles.length > 1) {
        const fileContents = [];
        for (const file of submission.attachedFiles) {
          try {
            const content = await googleDriveService.getFileContent(accessToken, file.id);
            fileContents.push(content);
          } catch (error) {
            console.error(`Error fetching content for file ${file.id}:`, error);
            fileContents.push({ name: file.name, content: "Error loading file content" });
          }
        }
        res.json(fileContents);
      } else {
        const fileContent = await googleDriveService.getFileContent(accessToken, submission.driveFileId);
        res.json(fileContent);
      }
    } catch (error) {
      console.error("Error fetching submission content:", error);
      res.status(500).json({ message: "Failed to fetch submission content" });
    }
  });

  // Get existing grade for submission
  app.get('/api/submissions/:submissionId/grade', isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmission(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const existingGrade = await storage.getGrade(req.params.submissionId);
      if (existingGrade) {
        res.json(existingGrade);
      } else {
        res.status(404).json({ message: "No existing grade found" });
      }
    } catch (error) {
      console.error("Error fetching existing grade:", error);
      res.status(500).json({ message: "Failed to fetch existing grade" });
    }
  });

  // Get grading criteria for assignment
  app.get('/api/assignments/:assignmentId/criteria', isAuthenticated, async (req: any, res) => {
    try {
      const criteria = await storage.getGradingCriteria(req.params.assignmentId);
      res.json(criteria);
    } catch (error) {
      console.error("Error fetching grading criteria:", error);
      res.status(500).json({ message: "Failed to fetch grading criteria" });
    }
  });

  // Set grading criteria for assignment
  app.post('/api/assignments/:assignmentId/criteria', isAuthenticated, async (req: any, res) => {
    try {
      const criteriaArray = req.body.criteria;
      if (!Array.isArray(criteriaArray)) {
        return res.status(400).json({ message: "Criteria must be an array" });
      }

      // Clear existing criteria for this assignment
      await storage.clearGradingCriteria(req.params.assignmentId);

      const savedCriteria = [];
      for (const criteriaData of criteriaArray) {
        const validatedCriteria = insertGradingCriteriaSchema.parse({
          ...criteriaData,
          assignmentId: req.params.assignmentId,
        });

        const criteria = await storage.upsertGradingCriteria(validatedCriteria);
        savedCriteria.push(criteria);
      }

      res.json(savedCriteria);
    } catch (error) {
      console.error("Error setting grading criteria:", error);
      res.status(500).json({ message: "Failed to set grading criteria" });
    }
  });

  // Mark submissions as pending
  app.post('/api/assignments/:id/submissions/mark-pending', isAuthenticated, async (req: any, res) => {
    try {
      const { submissionIds } = req.body;
      
      if (!submissionIds || !Array.isArray(submissionIds)) {
        return res.status(400).json({ message: "Invalid submission IDs provided" });
      }

      // Update all submissions to pending status
      for (const submissionId of submissionIds) {
        await storage.updateSubmissionStatus(submissionId, 'pending');
      }

      res.json({ message: "Submissions marked as pending", count: submissionIds.length });
    } catch (error) {
      console.error("Error marking submissions as pending:", error);
      res.status(500).json({ message: "Failed to mark submissions as pending" });
    }
  });

  // AI Grade submission
  app.post('/api/submissions/:submissionId/grade', isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmission(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const criteria = await storage.getGradingCriteria(assignment.id);
      if (criteria.length === 0) {
        return res.status(400).json({ message: "No grading criteria set for this assignment" });
      }

      // Get submission content for all files
      const accessToken = req.user.accessToken;
      let combinedContent = "";
      
      if (submission.attachedFiles && submission.attachedFiles.length > 1) {
        const fileContents = [];
        for (const file of submission.attachedFiles) {
          try {
            const content = await googleDriveService.getFileContent(accessToken, file.id);
            fileContents.push(`\n--- File: ${file.name} ---\n${content.content}`);
          } catch (error) {
            console.error(`Error fetching content for file ${file.id}:`, error);
            fileContents.push(`\n--- File: ${file.name} ---\nError loading file content`);
          }
        }
        combinedContent = fileContents.join('\n\n');
      } else {
        const fileContent = await googleDriveService.getFileContent(accessToken, submission.driveFileId!);
        combinedContent = fileContent.content;
      }

      // Grade with AI
      const gradingResult = await gradeSubmission({
        submissionContent: combinedContent,
        assignmentTitle: assignment.title,
        gradingCriteria: criteria.map(c => ({
          name: c.name,
          description: c.description,
          maxPoints: c.maxPoints,
          weight: c.weight,
        })),
        maxTotalPoints: assignment.maxPoints || 100,
      });

      // Save grade
      const gradeData = insertGradeSchema.parse({
        submissionId: submission.id,
        assignmentId: assignment.id,
        studentId: submission.studentId,
        totalScore: gradingResult.totalScore,
        maxScore: gradingResult.maxScore,
        feedback: gradingResult.feedback,
        criteriaScores: gradingResult.criteriaScores,
        isPostedToClassroom: false,
      });

      const grade = await storage.upsertGrade(gradeData);
      
      // Mark submission as graded
      await storage.updateSubmissionStatus(submission.id, 'graded');

      res.json({ grade, aiResult: gradingResult });
    } catch (error) {
      console.error("Error grading submission:", error);
      res.status(500).json({ message: "Failed to grade submission" });
    }
  });

  // File preview endpoint
  app.get('/api/files/:fileId/preview', isAuthenticated, async (req: any, res) => {
    try {
      const accessToken = req.user.accessToken;
      const fileContent = await googleDriveService.getFileContent(accessToken, req.params.fileId);
      
      if (fileContent.mimeType?.includes('text') || fileContent.mimeType?.includes('application/pdf')) {
        res.redirect(`https://drive.google.com/file/d/${req.params.fileId}/preview`);
      } else {
        res.json({ message: "File type not supported for preview" });
      }
    } catch (error) {
      console.error("Error getting file preview:", error);
      res.status(500).json({ message: "Failed to get file preview" });
    }
  });

  // Download individual file with original format
  app.get('/api/files/:fileId/download', isAuthenticated, async (req: any, res) => {
    try {
      const accessToken = req.user.accessToken;
      const fileData = await googleDriveService.downloadFileAsBlob(accessToken, req.params.fileId);
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.name}"`);
      res.setHeader('Content-Type', fileData.mimeType);
      res.send(fileData.blob);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Get submission files metadata for download
  app.get('/api/submissions/:submissionId/files', isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmission(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const accessToken = req.user.accessToken;
      const files = [];

      // Get all attached files
      if (submission.attachedFiles && submission.attachedFiles.length > 0) {
        for (const file of submission.attachedFiles) {
          try {
            const metadata = await googleDriveService.getFileMetadata(accessToken, file.id);
            files.push({
              id: file.id,
              name: metadata.name || file.name,
              mimeType: metadata.mimeType,
              size: metadata.size,
              downloadUrl: `/api/files/${file.id}/download`
            });
          } catch (error) {
            console.error(`Error getting metadata for file ${file.id}:`, error);
          }
        }
      } else if (submission.driveFileId) {
        // Get primary file metadata
        try {
          const metadata = await googleDriveService.getFileMetadata(accessToken, submission.driveFileId);
          files.push({
            id: submission.driveFileId,
            name: metadata.name || submission.fileName || 'submission',
            mimeType: metadata.mimeType,
            size: metadata.size,
            downloadUrl: `/api/files/${submission.driveFileId}/download`
          });
        } catch (error) {
          console.error(`Error getting metadata for primary file ${submission.driveFileId}:`, error);
        }
      }

      res.json(files);
    } catch (error) {
      console.error("Error getting submission files:", error);
      res.status(500).json({ message: "Failed to get submission files" });
    }
  });

  // Get all submission files for assignment (for bulk download)
  app.get('/api/assignments/:assignmentId/files', isAuthenticated, async (req: any, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const submissions = await storage.getSubmissions(req.params.assignmentId);
      const accessToken = req.user.accessToken;
      const allFiles = [];

      for (const submission of submissions) {
        const student = await storage.getStudent(submission.studentId);
        const studentName = student?.name || 'Unknown Student';

        // Get all files for this submission
        if (submission.attachedFiles && submission.attachedFiles.length > 0) {
          for (const [index, file] of submission.attachedFiles.entries()) {
            try {
              const metadata = await googleDriveService.getFileMetadata(accessToken, file.id);
              const originalName = metadata.name || file.name;
              const extension = originalName.split('.').pop() || '';
              const baseName = originalName.replace(/\.[^/.]+$/, '');
              
              allFiles.push({
                id: file.id,
                originalName: originalName,
                downloadName: `${studentName}_${baseName}_${index + 1}.${extension}`,
                mimeType: metadata.mimeType,
                size: metadata.size,
                downloadUrl: `/api/files/${file.id}/download`,
                studentName: studentName,
                submissionId: submission.id
              });
            } catch (error) {
              console.error(`Error getting metadata for file ${file.id}:`, error);
            }
          }
        } else if (submission.driveFileId) {
          try {
            const metadata = await googleDriveService.getFileMetadata(accessToken, submission.driveFileId);
            const originalName = metadata.name || submission.fileName || 'submission';
            const extension = originalName.split('.').pop() || '';
            const baseName = originalName.replace(/\.[^/.]+$/, '');
            
            allFiles.push({
              id: submission.driveFileId,
              originalName: originalName,
              downloadName: `${studentName}_${baseName}.${extension}`,
              mimeType: metadata.mimeType,
              size: metadata.size,
              downloadUrl: `/api/files/${submission.driveFileId}/download`,
              studentName: studentName,
              submissionId: submission.id
            });
          } catch (error) {
            console.error(`Error getting metadata for primary file ${submission.driveFileId}:`, error);
          }
        }
      }

      res.json(allFiles);
    } catch (error) {
      console.error("Error getting assignment files:", error);
      res.status(500).json({ message: "Failed to get assignment files" });
    }
  });

  // Post grade to Google Classroom
  app.post('/api/grades/:gradeId/post', isAuthenticated, async (req: any, res) => {
    try {
      const grade = await storage.getGrade(req.params.gradeId);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }

      const submission = await storage.getSubmission(grade.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const accessToken = req.user.accessToken;

      await googleClassroomService.postGrade(
        accessToken,
        submission.classroomId,
        submission.assignmentId,
        submission.studentId,
        grade.totalScore!,
        grade.feedback || undefined
      );

      await storage.markGradeAsPosted(grade.id);

      res.json({ message: "Grade posted successfully" });
    } catch (error) {
      console.error("Error posting grade:", error);
      res.status(500).json({ message: "Failed to post grade to Google Classroom" });
    }
  });

  // Get pending grades
  app.get('/api/grades/pending', isAuthenticated, async (req: any, res) => {
    try {
      const grades = await storage.getGrades();
      const pendingGrades = grades.filter(grade => !grade.isPostedToClassroom);

      const gradesWithDetails = await Promise.all(
        pendingGrades.map(async (grade) => {
          const submission = await storage.getSubmission(grade.submissionId);
          const student = submission ? await storage.getStudent(submission.studentId) : null;
          const assignment = submission ? await storage.getAssignment(submission.assignmentId) : null;

          return {
            ...grade,
            submission,
            student,
            assignment,
          };
        })
      );

      res.json(gradesWithDetails);
    } catch (error) {
      console.error("Error fetching pending grades:", error);
      res.status(500).json({ message: "Failed to fetch pending grades" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}