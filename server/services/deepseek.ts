import OpenAI from "openai";

const deepseek = new OpenAI({ 
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-temp-key",
  baseURL: "https://api.deepseek.com"
});

export interface GradingRequest {
  submissionContent: string;
  assignmentTitle: string;
  gradingCriteria: Array<{
    name: string;
    description?: string;
    maxPoints: number;
    weight: number;
  }>;
  maxTotalPoints: number;
}

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  criteriaScores: Record<string, number>;
  feedback: string;
  suggestions: string[];
}

export async function gradeSubmission(request: GradingRequest): Promise<GradingResult> {
  try {
    const prompt = `
You are an expert educational grader. Please grade the following student submission based on the provided criteria.

Assignment: ${request.assignmentTitle}
Max Total Points: ${request.maxTotalPoints}

Grading Criteria:
${request.gradingCriteria.map(criteria => 
  `- ${criteria.name} (${criteria.maxPoints} points, ${criteria.weight}% weight): ${criteria.description || 'No description provided'}`
).join('\n')}

Student Submission:
${request.submissionContent}

Please provide a detailed grading with scores for each criterion and overall feedback. Be constructive and specific in your feedback, highlighting both strengths and areas for improvement.

Respond with JSON in this exact format:
{
  "totalScore": number,
  "maxScore": number,
  "criteriaScores": {
    "criteriaName1": score,
    "criteriaName2": score
  },
  "feedback": "detailed feedback string",
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat", // Using DeepSeek's chat model for grading
      messages: [
        {
          role: "system",
          content: "You are an expert educational grader. Provide fair, constructive, and detailed feedback on student submissions. Always respond with valid JSON in the requested format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent grading
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Validate and sanitize the response
    const gradingResult: GradingResult = {
      totalScore: Math.max(0, Math.min(request.maxTotalPoints, result.totalScore || 0)),
      maxScore: request.maxTotalPoints,
      criteriaScores: result.criteriaScores || {},
      feedback: result.feedback || "No feedback provided.",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };

    return gradingResult;
  } catch (error) {
    console.error("Error grading submission:", error);
    throw new Error("Failed to grade submission with AI: " + (error as Error).message);
  }
}

export async function generateFeedback(submissionContent: string, assignmentTitle: string): Promise<string> {
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat", // Using DeepSeek's chat model for feedback generation
      messages: [
        {
          role: "system",
          content: "You are a helpful educational assistant. Provide constructive feedback on student submissions."
        },
        {
          role: "user",
          content: `Please provide detailed, constructive feedback for this ${assignmentTitle} submission:\n\n${submissionContent}`
        }
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content || "No feedback could be generated.";
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw new Error("Failed to generate feedback: " + (error as Error).message);
  }
}