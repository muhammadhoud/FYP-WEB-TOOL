import { google } from 'googleapis';

export interface GoogleClassroomService {
  getClassrooms(accessToken: string): Promise<any[]>;
  getStudents(accessToken: string, classroomId: string): Promise<any[]>;
  getAssignments(accessToken: string, classroomId: string): Promise<any[]>;
  getSubmissions(accessToken: string, classroomId: string, assignmentId: string): Promise<any[]>;
  postGrade(accessToken: string, classroomId: string, assignmentId: string, studentId: string, grade: number, feedback?: string): Promise<void>;
}

class GoogleClassroomServiceImpl implements GoogleClassroomService {
  private getAuth(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
  }

  async getClassrooms(accessToken: string): Promise<any[]> {
    try {
      const auth = this.getAuth(accessToken);
      const classroom = google.classroom({ version: 'v1', auth });
      
      const response = await classroom.courses.list({
        teacherId: 'me',
        courseStates: ['ACTIVE'],
      });

      return response.data.courses || [];
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      throw new Error('Failed to fetch classrooms from Google Classroom');
    }
  }

  async getStudents(accessToken: string, classroomId: string): Promise<any[]> {
    try {
      const auth = this.getAuth(accessToken);
      const classroom = google.classroom({ version: 'v1', auth });
      
      const response = await classroom.courses.students.list({
        courseId: classroomId,
      });

      return response.data.students || [];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students from Google Classroom');
    }
  }

  async getAssignments(accessToken: string, classroomId: string): Promise<any[]> {
    try {
      const auth = this.getAuth(accessToken);
      const classroom = google.classroom({ version: 'v1', auth });
      
      const response = await classroom.courses.courseWork.list({
        courseId: classroomId,
      });

      return response.data.courseWork || [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw new Error('Failed to fetch assignments from Google Classroom');
    }
  }

  async getSubmissions(accessToken: string, classroomId: string, assignmentId: string): Promise<any[]> {
    try {
      const auth = this.getAuth(accessToken);
      const classroom = google.classroom({ version: 'v1', auth });
      
      const response = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: classroomId,
        courseWorkId: assignmentId,
      });

      return response.data.studentSubmissions || [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw new Error('Failed to fetch submissions from Google Classroom');
    }
  }

  async postGrade(accessToken: string, classroomId: string, assignmentId: string, studentId: string, grade: number, feedback?: string): Promise<void> {
    try {
      const auth = this.getAuth(accessToken);
      const classroom = google.classroom({ version: 'v1', auth });
      
      // Find the submission
      const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: classroomId,
        courseWorkId: assignmentId,
        userId: studentId,
      });

      const submission = submissionsResponse.data.studentSubmissions?.[0];
      if (!submission?.id) {
        throw new Error('Submission not found');
      }

      // Update the grade
      await classroom.courses.courseWork.studentSubmissions.patch({
        courseId: classroomId,
        courseWorkId: assignmentId,
        id: submission.id,
        updateMask: 'assignedGrade,draftGrade',
        requestBody: {
          assignedGrade: grade,
          draftGrade: grade,
        },
      });

      // Add feedback if provided
      if (feedback) {
        await classroom.courses.courseWork.studentSubmissions.modifyAttachments({
          courseId: classroomId,
          courseWorkId: assignmentId,
          id: submission.id,
          requestBody: {
            addAttachments: [{
              link: {
                title: 'Feedback',
                url: `data:text/plain;charset=utf-8,${encodeURIComponent(feedback)}`,
              },
            }],
          },
        });
      }
    } catch (error) {
      console.error('Error posting grade:', error);
      throw new Error('Failed to post grade to Google Classroom');
    }
  }
}

export const googleClassroomService = new GoogleClassroomServiceImpl();
