# MyLinuxLearning

An interactive Linux learning platform with 12 chapters, 50 hands-on labs, and 72 quiz questions. Built as a serverless single-page application on AWS.

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────────┐
│   Browser    │──────▶│  CloudFront  │──────▶│   S3 (React)    │
└─────────────┘       └──────────────┘       └─────────────────┘
       │
       │  API calls
       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  API Gateway    │──▶│  Lambda (x4)    │──▶│   DynamoDB      │
│  (REST)         │   │  Node.js 20     │   │  (progress)     │
└─────────────────┘   └─────────────────┘   └─────────────────┘

CI/CD: GitHub Actions → OIDC → AWS (S3 deploy + Lambda update)
```

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | React 18, Vite, React Router            |
| Backend        | AWS Lambda (Node.js 20), API Gateway    |
| Database       | DynamoDB (on-demand)                    |
| Hosting        | S3 + CloudFront (OAC)                   |
| Infrastructure | AWS CDK v2 (TypeScript)                 |
| CI/CD          | GitHub Actions with OIDC authentication |

## Prerequisites

- **Node.js 20** — [download](https://nodejs.org/)
- **AWS CLI v2** — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK CLI** — `npm install -g aws-cdk`
- An AWS account with credentials configured

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/FahimR97/MyLinuxLearning.git
cd MyLinuxLearning
```

### 2. Deploy infrastructure

```bash
cd cdk
npm install
npx cdk bootstrap
npx cdk deploy --all
```

### 3. Note the stack outputs

After deployment, CDK prints these outputs:

| Output              | Used for                  |
|---------------------|---------------------------|
| `BucketName`        | S3_BUCKET GitHub secret   |
| `CloudFrontDomain`  | Your site URL             |
| `ApiUrl`            | API_URL GitHub secret     |
| `OIDCRoleArn`       | AWS_ROLE_ARN GitHub secret|
| `CloudFrontDistId`  | CLOUDFRONT_DIST_ID secret |

### 4. Set GitHub secrets

Go to **Settings → Secrets and variables → Actions** in your GitHub repo and add:

| Secret               | Value                                    |
|----------------------|------------------------------------------|
| `AWS_ROLE_ARN`       | The OIDC role ARN from stack outputs     |
| `S3_BUCKET`          | The S3 bucket name from stack outputs    |
| `CLOUDFRONT_DIST_ID` | The CloudFront distribution ID           |
| `API_URL`            | The API Gateway URL from stack outputs   |

### 5. Deploy

Push to `main` to trigger the GitHub Actions pipeline, or run it manually via **Actions → Deploy → Run workflow**.

## Local Development

```bash
# Install frontend dependencies
cd frontend
npm install

# Start dev server (uses local JSON fallback — no AWS needed)
npm run dev
```

The frontend runs at `http://localhost:5173` with local content files and localStorage for progress tracking.

### Root scripts

From the repo root:

```bash
npm run dev:frontend     # Start frontend dev server
npm run build:frontend   # Production build
npm run deploy:infra     # Deploy all CDK stacks
```

## Content Structure

```
backend/content/
├── chapters.json   # 12 chapters with markdown content
├── labs.json       # 50 hands-on labs (4-5 per chapter)
└── quizzes.json    # 72 quiz questions (5-7 per chapter)
```

**Chapters:** File Permissions, Process Management, Text Processing, User Management, Filesystem, Systemd & Services, Monitoring & Performance, Logging, Networking, Bash Scripting, Boot Process, Interview Q&A Bank.

Each chapter includes detailed markdown content, interactive terminal-style labs with step-by-step instructions, and multiple-choice quizzes with explanations.

## Project Structure

```
MyLinuxLearning/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── pages/     # Home, ChapterList, ChapterDetail, LabView, QuizView, ProgressDashboard
│   │   ├── components/# Sidebar, Terminal, CodeBlock
│   │   └── api/       # API client with local fallback
│   └── package.json
├── backend/           # Lambda functions + content
│   ├── lambdas/       # chapters, labs, quizzes, progress
│   ├── content/       # JSON content files
│   └── package.json
├── cdk/               # AWS CDK infrastructure
│   ├── lib/           # FrontendStack, BackendStack, PipelineStack
│   └── bin/app.ts
├── .github/workflows/ # CI/CD pipeline
├── package.json       # Root convenience scripts
└── README.md
```
