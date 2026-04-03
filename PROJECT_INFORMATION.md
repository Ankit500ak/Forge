# FORGE Fitness Platform — Comprehensive Project Information Document

## Document Control
- Project Name: FORGE Fitness Platform
- Document Type: Project Information File
- Version: 1.0
- Date: 10 March 2026
- Prepared For: Technical Review, Academic Submission, and Product Stakeholder Briefing

## 1. Project Overview
FORGE is a full-stack gamified fitness platform that combines activity tracking, performance progression, intelligent nutrition analysis, and camera-assisted food logging. The system is engineered to improve user consistency in fitness routines by transforming workouts and diet logging into measurable progression loops such as XP growth, rank advancement, and reward redemption.

The solution includes:
- A backend API layer for authentication, user data, ranks, tasks, food intelligence, and camera workflows.
- A frontend web and mobile-ready interface built for high engagement and responsive usage.
- AI/ML-assisted food recognition with nutrition enrichment for calorie and macro tracking.

## 2. Business Purpose and Problem Statement
### Problem Addressed
Most fitness applications provide isolated tracking without sustained behavioral reinforcement. Users frequently drop engagement when progress feedback is unclear or repetitive.

### Purpose of FORGE
FORGE addresses this by integrating:
- Habit formation through gamification (XP, ranks, rewards).
- Practical utility through daily fitness and food logs.
- Data-backed insights through analytics and AI-assisted recognition.

### Intended Outcomes
- Improve daily consistency in workouts and nutrition tracking.
- Increase user retention with progression-focused UX patterns.
- Provide an extensible base for mobile deployment and future AI coaching features.

## 3. Scope of the Current Implementation
### 3.1 User and Security Domain
- Account registration and login with JWT-protected access.
- User profile retrieval and update endpoints.
- Role of authentication middleware in access control.

### 3.2 Fitness Progression Domain
- XP and rank progression services.
- Task generation and task reset scheduling.
- Leaderboard/ranking related route surfaces.

### 3.3 Nutrition and Food Intelligence Domain
- Food detection from camera/image inputs.
- Nutrition retrieval and meal analysis endpoints.
- Goal-based recommendation support.

### 3.4 Camera and Capture Domain
- Camera capture APIs and image processing workflow.
- Confidence-driven detection flow and result handling.
- Capture history and service health diagnostics.

## 4. System Architecture
### 4.1 Architectural Style
- Client-server architecture.
- Modular API routing with domain-separated services.
- Hybrid ML execution (Node.js orchestration + Python model processing).

### 4.2 Backend Architecture
- Runtime: Node.js (ESM) with Express.
- Core services initialized at startup:
  - Database connection pool initialization.
  - Migration execution.
  - XP rollover service.
  - Daily task scheduler initialization.
- Main route groups:
  - /api/auth
  - /api/users
  - /api/ranks
  - /api/tasks
  - /api/debug
  - /api/food
  - /api/camera

### 4.3 Data and Integration Layer
- Primary relational data access through PostgreSQL via pooled connections.
- Supabase client dependency available for selected workflows.
- Multer-based upload handling for image ingestion.

### 4.4 Frontend Architecture
- Framework: Next.js with App Router and React.
- Styling/UI: Tailwind CSS and component-driven UI primitives.
- Mobile packaging path: Capacitor scripts for Android and iOS.
- Charts/analytics visualization included in user experience.

## 5. Machine Learning and AI Details
## 5.1 Primary Production-Integrated Food Model
- Model Family: Transfer Learning using MobileNetV2 backbone.
- Framework: TensorFlow / Keras (Python integration) plus TensorFlow.js dependency in JavaScript stack.
- Input Shape: 224 x 224 x 3.
- Output Layer: Softmax classification over configured food classes.
- Current Integration Pattern:
  - Node service invokes Python detector script through child process.
  - Detection output is returned as structured JSON.
  - Nutrition metadata is mapped to detected class.

### 5.2 Food Domain Coverage
- North Indian food taxonomy included with nutrition attributes.
- Repository documentation references support for roughly 24 food classes in the active subsystem documentation.
- Output fields include confidence scores, top prediction list, and macro-level nutrition information.

### 5.3 Detection Pipeline
1. Image capture/upload.
2. Image preprocessing to model format.
3. Inference with confidence scoring.
4. Threshold filtering and best-class selection.
5. Nutrition data lookup and response composition.
6. Optional logging for meal/daily summary workflows.

### 5.4 Related ML Readiness in Workout Domain
- Frontend dependencies include PoseNet and MediaPipe packages.
- Workout module references indicate pose tracking integration points are scaffolded/simulated and positioned for production-level real-time movement analysis.

## 6. Technology Stack
### Backend
- Node.js, Express, PostgreSQL (pg)
- JWT (jsonwebtoken), bcrypt/bcryptjs
- Multer (multipart uploads), CORS, dotenv
- Cron scheduling and migration orchestration

### Frontend
- Next.js, React, TypeScript
- Tailwind CSS, Radix component primitives
- Recharts for data visualization
- Capacitor for mobile app packaging

### AI/ML
- TensorFlow/TensorFlow.js ecosystem
- Python Keras model execution for food classification
- Transfer learning strategy with MobileNetV2

## 7. API Capabilities (High-Level)
- Authentication: registration, login, logout.
- User services: profile retrieval/update.
- Health monitoring: general API and subsystem health endpoints.
- Fitness operations: task and rank-related endpoints.
- Food services: detect, foods list, nutrition lookup, meal analysis, recommendations, search, stats.
- Camera services: capture/process/settings/history and health-check surfaces.

## 8. Security, Reliability, and Operations
### Security Controls
- JWT-based protected route access.
- Configurable CORS origin policy.
- Structured request/response handling and error middleware.

### Reliability Controls
- Database connection retry patterns.
- Service startup migration execution.
- Daily scheduler automation for recurring operations.
- Health endpoints for observability and readiness checks.

### Operational Assets
- Extensive subsystem documentation in repository.
- Setup scripts for local environment bootstrap.
- Benchmark and validation scripts for ML and API behavior.

## 9. Quality and Maturity Assessment
Current state is best characterized as advanced prototype / pre-production:
- Significant implementation breadth across core domains.
- Strong documentation and test utility coverage for camera-food workflows.
- Clear extensibility path for scaling to production controls (CI, telemetry, hardened auth, SLO monitoring).

## 10. Strategic Advantages
- Differentiated engagement through gamification and progression loops.
- Practical daily value via integrated food and fitness tracking.
- AI-assisted nutrition logging lowers user effort and improves consistency.
- Multi-platform potential with web + mobile deployment track.

## 11. Known Gaps and Recommended Improvements
- Consolidate multiple readme/spec artifacts into a single governance standard.
- Add end-to-end test coverage for critical user journeys.
- Standardize model registry/versioning and model performance reporting.
- Implement full observability stack (structured logs, traces, metrics dashboard).
- Finalize production hardening: rate limits, secret management, policy-driven access controls.

## 12. Conclusion
FORGE is a technically substantial, extensible fitness platform with an effective blend of gamified progression, API-driven architecture, and AI-assisted nutrition intelligence. The current implementation demonstrates strong capability for transition into production with targeted hardening and delivery governance.
