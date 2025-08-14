# EduGrade AI - Automated Grading Platform

## Overview

EduGrade AI is an intelligent educational grading platform that integrates with Google Classroom to automate the assessment process. The system leverages AI-powered grading capabilities to evaluate student submissions based on customizable criteria, providing detailed feedback and seamless integration with Google's educational ecosystem. Built as a full-stack web application, it combines a React frontend with an Express.js backend, utilizing PostgreSQL for data persistence and OpenAI for intelligent grading capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React and TypeScript, utilizing modern development patterns:
- **Component Library**: Radix UI components with shadcn/ui styling for consistent, accessible interface elements
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Animations**: Framer Motion for professional splash screen and micro-interactions
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
The server follows a RESTful API design with Express.js:
- **Runtime**: Node.js with TypeScript using ESM modules
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Management**: PostgreSQL-backed session storage with connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling and request logging
- **File Structure**: Modular organization with separate route handlers and service layers

### Database Schema
PostgreSQL database with Drizzle ORM for type-safe database interactions:
- **Core Tables**: Users, classrooms, assignments, students, submissions, grading criteria, and grades
- **Session Storage**: Dedicated table for authentication session persistence
- **Relationships**: Foreign key constraints maintaining data integrity across educational entities
- **Migration System**: Drizzle Kit for database schema versioning and deployment

### Authentication System
Integrated Replit Auth providing:
- **OAuth Flow**: OpenID Connect with Google for seamless user onboarding
- **Session Security**: HTTP-only cookies with configurable TTL and secure flags
- **User Management**: Automatic user creation and profile synchronization
- **Authorization**: Route-level protection with authentication middleware

### AI Integration
DeepSeek AI integration for intelligent grading capabilities:
- **Submission Analysis**: Content evaluation against customizable grading criteria using DeepSeek's chat model
- **Scoring System**: Weighted scoring with detailed breakdown by criteria
- **Feedback Generation**: Constructive feedback and improvement suggestions
- **Error Handling**: Graceful fallbacks for API limitations or failures

## External Dependencies

### Google Services Integration
- **Google Classroom API**: Fetching classrooms, students, assignments, and submissions
- **Google Drive API**: Accessing and retrieving student submission files
- **OAuth 2.0**: Authentication flow for accessing Google services on behalf of users

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management
- **Session Storage**: PostgreSQL-backed session persistence for authentication

### AI and Machine Learning
- **DeepSeek API**: DeepSeek chat models for intelligent content analysis and grading
- **Custom Prompting**: Structured prompts for consistent grading evaluation

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide Icons**: Consistent iconography throughout the application

### Development and Build Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Modern build tooling with hot module replacement
- **ESBuild**: Fast bundling for production server builds
- **Replit Integration**: Development environment optimization and error handling