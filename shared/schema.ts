import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const classrooms = pgTable("classrooms", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  section: text("section"),
  grade: text("grade"),
  description: text("description"),
  teacherId: varchar("teacher_id").notNull(),
  studentCount: integer("student_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey(),
  classroomId: varchar("classroom_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  maxPoints: integer("max_points"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey(),
  classroomId: varchar("classroom_id").notNull(),
  name: text("name").notNull(),
  email: varchar("email"),
  profileImageUrl: varchar("profile_image_url"),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey(),
  assignmentId: varchar("assignment_id").notNull(),
  studentId: varchar("student_id").notNull(),
  classroomId: varchar("classroom_id").notNull(),
  driveFileId: varchar("drive_file_id"),
  fileName: text("file_name"),
  submittedAt: timestamp("submitted_at"),
  isGraded: boolean("is_graded").default(false),
  status: varchar("status").default("ungraded"), // ungraded, pending, graded, error
  attachedFiles: jsonb("attached_files"), // Array of {id: string, name: string}
});

export const gradingCriteria = pgTable("grading_criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  maxPoints: integer("max_points").notNull(),
  weight: integer("weight").default(25), // percentage
});

export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull(),
  assignmentId: varchar("assignment_id").notNull(),
  studentId: varchar("student_id").notNull(),
  totalScore: integer("total_score"),
  maxScore: integer("max_score"),
  feedback: text("feedback"),
  criteriaScores: jsonb("criteria_scores"), // {criteriaId: score}
  isPostedToClassroom: boolean("is_posted_to_classroom").default(false),
  gradedAt: timestamp("graded_at").defaultNow(),
  postedAt: timestamp("posted_at"),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = typeof classrooms.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

export type GradingCriteria = typeof gradingCriteria.$inferSelect;
export type InsertGradingCriteria = typeof gradingCriteria.$inferInsert;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

export const insertGradingCriteriaSchema = createInsertSchema(gradingCriteria).omit({
  id: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  gradedAt: true,
});
