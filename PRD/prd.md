# David Speaker App - Product Requirements Document

## Overview
David Speaker App is a platform for analyzing and improving public speaking skills through AI-powered evaluation and professional coaching. The platform enables users to submit video recordings of their speeches for automated analysis, with optional professional coaching feedback.

## User Roles
1. **Students**: Submit videos for analysis and receive feedback
2. **Coaches**: Provide professional feedback on student submissions
3. **Administrators**: Manage the platform, users, and analytics

## Core User Flows

### Student Flow
1. **Sign up/Login** - Students create an account or log in
2. **Submit Video** - Students submit a YouTube video link for analysis
3. **Receive AI Analysis** - Students receive automated feedback on speaking patterns
4. **Request Coach Review** - Students can optionally request a coach to review their speech
5. **View Feedback** - Students can view both AI and coach feedback

### Coach Flow
1. **Sign up/Login** - Coaches create an account (pending admin approval)
2. **View Assigned Evaluations** - Coaches can view evaluations assigned to them
3. **Provide Feedback** - Coaches can analyze the video and provide professional feedback
4. **Submit Review** - Coaches submit their review which becomes available to the student

### Admin Flow
1. **Dashboard Overview** - View platform metrics and recent activity
2. **User Management** - Approve coaches, manage users
3. **Evaluation Management** - Assign evaluations to coaches, view all evaluations
4. **System Configuration** - Configure scoring rules and other system settings

## Speech Analysis Features
The platform analyzes several aspects of speech:

### Structural Elements
- Adapted language
- Flow
- Strong rhetoric
- Strategic language
- Valued language

### Filler Elements
- Filler language (um, uh, like)
- Negations
- Repetitive words
- Absolute words

### Rhetorical Devices
- Hexacolon/Tricolon (lists of 6/3 parallel elements)
- Repetition
- Anaphora/Epiphora (repetition at beginning/end)
- Alliteration
- Other rhetorical devices

## Technical Architecture
- Next.js for frontend and API routes
- Supabase for authentication and database
- Google Gemini AI for speech analysis
- YouTube API for video transcription

## Status Flow
1. **pending**: Initial state when a video is first submitted
2. **completed**: AI analysis is complete
3. **ready_for_coach**: Ready to be assigned to a coach
4. **coach_assigned**: Assigned to a coach but not yet reviewed
5. **coach_reviewing**: Coach is actively reviewing
6. **published**: Final state, review is complete and published to student

## Deployment Strategy
The application is deployed on Vercel with a Supabase backend infrastructure.

