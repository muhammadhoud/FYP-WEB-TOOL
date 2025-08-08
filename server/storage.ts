import {
  users,
  classrooms,
  assignments,
  students,
  submissions,
  gradingCriteria,
  grades,
  type User,
  type UpsertUser,
  type Classroom,
  type InsertClassroom,
  type Assignment,
  type InsertAssignment,
  type Student,
  type InsertStudent,
  type Submission,
  type InsertSubmission,
  type GradingCriteria,
  type InsertGradingCriteria,
  type Grade,
  type InsertGrade,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Classroom operations
  getClassrooms(teacherId: string): Promise<Classroom[]>;
  getClassroom(id: string): Promise<Classroom | undefined>;
  upsertClassroom(classroom: InsertClassroom): Promise<Classroom>;
  
  // Assignment operations
  getAssignments(classroomId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  upsertAssignment(assignment: InsertAssignment): Promise<Assignment>;
  
  // Student operations
  getStudents(classroomId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  upsertStudent(student: InsertStudent): Promise<Student>;
  
  // Submission operations
  getSubmissions(assignmentId: string): Promise<Submission[]>;
  getSubmission(id: string): Promise<Submission | undefined>;
  upsertSubmission(submission: InsertSubmission): Promise<Submission>;
  
  // Grading criteria operations
  getGradingCriteria(assignmentId: string): Promise<GradingCriteria[]>;
  upsertGradingCriteria(criteria: InsertGradingCriteria): Promise<GradingCriteria>;
  
  // Grade operations
  getGrades(assignmentId?: string, studentId?: string): Promise<Grade[]>;
  getGrade(submissionId: string): Promise<Grade | undefined>;
  upsertGrade(grade: InsertGrade): Promise<Grade>;
  markGradeAsPosted(gradeId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private classrooms: Map<string, Classroom> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private students: Map<string, Student> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private gradingCriteria: Map<string, GradingCriteria> = new Map();
  private grades: Map<string, Grade> = new Map();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const user: User = {
      ...existing,
      ...userData,
      id: userData.id || randomUUID(),
      updatedAt: new Date(),
      createdAt: existing?.createdAt || new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Classroom operations
  async getClassrooms(teacherId: string): Promise<Classroom[]> {
    return Array.from(this.classrooms.values()).filter(
      (classroom) => classroom.teacherId === teacherId
    );
  }

  async getClassroom(id: string): Promise<Classroom | undefined> {
    return this.classrooms.get(id);
  }

  async upsertClassroom(classroomData: InsertClassroom): Promise<Classroom> {
    const existing = this.classrooms.get(classroomData.id);
    const classroom: Classroom = {
      ...existing,
      ...classroomData,
      updatedAt: new Date(),
      createdAt: existing?.createdAt || new Date(),
    };
    this.classrooms.set(classroom.id, classroom);
    return classroom;
  }

  // Assignment operations
  async getAssignments(classroomId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.classroomId === classroomId
    );
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async upsertAssignment(assignmentData: InsertAssignment): Promise<Assignment> {
    const assignment: Assignment = {
      ...assignmentData,
      createdAt: new Date(),
    };
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  // Student operations
  async getStudents(classroomId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.classroomId === classroomId
    );
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async upsertStudent(studentData: InsertStudent): Promise<Student> {
    const student: Student = {
      ...studentData,
    };
    this.students.set(student.id, student);
    return student;
  }

  // Submission operations
  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.assignmentId === assignmentId
    );
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    try {
      return this.submissions.get(id);
    } catch (error) {
      console.error("Error getting submission:", error);
      return undefined;
    }
  }

  async upsertSubmission(submissionData: InsertSubmission): Promise<Submission> {
    const existing = this.submissions.get(submissionData.id);
    const submission: Submission = {
      ...existing,
      ...submissionData,
    };
    this.submissions.set(submission.id, submission);
    return submission;
  }

  // Grading criteria operations
  async getGradingCriteria(assignmentId: string): Promise<GradingCriteria[]> {
    return Array.from(this.gradingCriteria.values()).filter(
      (criteria) => criteria.assignmentId === assignmentId
    );
  }

  async upsertGradingCriteria(criteriaData: InsertGradingCriteria): Promise<GradingCriteria> {
    const criteria: GradingCriteria = {
      ...criteriaData,
      id: randomUUID(),
    };
    this.gradingCriteria.set(criteria.id, criteria);
    return criteria;
  }

  async clearGradingCriteria(assignmentId: string): Promise<void> {
    const criteriaToDelete = Array.from(this.gradingCriteria.values()).filter(
      (criteria) => criteria.assignmentId === assignmentId
    );
    
    for (const criteria of criteriaToDelete) {
      this.gradingCriteria.delete(criteria.id);
    }
  }

  async clearGradingCriteria(assignmentId: string): Promise<void> {
    const criteriaToDelete = Array.from(this.gradingCriteria.entries())
      .filter(([_, criteria]) => criteria.assignmentId === assignmentId)
      .map(([id, _]) => id);
    
    criteriaToDelete.forEach(id => this.gradingCriteria.delete(id));
  }

  // Grade operations
  async getGrades(assignmentId?: string, studentId?: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter((grade) => {
      if (assignmentId && grade.assignmentId !== assignmentId) return false;
      if (studentId && grade.studentId !== studentId) return false;
      return true;
    });
  }

  async getGrade(submissionId: string): Promise<Grade | undefined> {
    try {
      return Array.from(this.grades.values()).find(
        (grade) => grade.submissionId === submissionId
      );
    } catch (error) {
      console.error("Error getting grade:", error);
      return undefined;
    }
  }

  async upsertGrade(gradeData: InsertGrade): Promise<Grade> {
    const existing = Array.from(this.grades.values()).find(
      (grade) => grade.submissionId === gradeData.submissionId
    );
    
    const grade: Grade = {
      ...existing,
      ...gradeData,
      id: existing?.id || randomUUID(),
      gradedAt: existing?.gradedAt || new Date(),
    };
    this.grades.set(grade.id, grade);
    return grade;
  }

  async markGradeAsPosted(gradeId: string): Promise<void> {
    const grade = this.grades.get(gradeId);
    if (grade) {
      const updatedGrade = {
        ...grade,
        isPostedToClassroom: true,
        postedAt: new Date(),
      };
      this.grades.set(gradeId, updatedGrade);
    }
  }
}

export const storage = new MemStorage();
