# Infrastructure and Deployment Guide

This document describes how to provision Debate Club infrastructure, build container images, and deploy the application for the Phase 4 launch. It complements the Terraform configuration in `infra/terraform` and the Docker resources in the repository root.

## Prerequisites

* Terraform >= 1.5
* AWS CLI configured with administrator privileges
* Docker and Docker Compose
* Access to an AWS account with permissions for VPC, ECS, RDS, IAM, S3, CodeBuild, and CodePipeline
* A GitHub repository containing the Debate Club source
* An AWS CodeStar connection linking the AWS account with the GitHub repository

## Environment Variables

Set the following environment variables locally before running Docker Compose or Terraform:

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by the backend and Prisma. | `postgresql://debate_club:change_me@localhost:5432/debate_club` |
| `PORT` | Backend listening port. | `4000` |
| `TURN_URL` | TURN server URI used by WebRTC clients. | `turn:localhost:3478` |
| `TURN_USERNAME` | TURN username for authentication. | `debate` |
| `TURN_PASSWORD` | TURN password for authentication. | `debatepass` |
| `VITE_API_URL` | Frontend base URL for API requests. | `http://localhost:4000` |
| `AWS_REGION` | Region targeted by Terraform deployments. | `us-east-1` |
| `TF_VAR_db_username` | Terraform variable defining the PostgreSQL admin user. | `debate_admin` |
| `TF_VAR_db_password` | Terraform variable defining the PostgreSQL admin password. | `super-secret-password` |
| `TF_VAR_codestar_connection_arn` | CodeStar connection ARN used by CodePipeline. | `arn:aws:codestar-connections:...` |
| `TF_VAR_github_owner` | GitHub organization or user name. | `example-org` |
| `TF_VAR_github_repo` | GitHub repository name. | `debate-club` |
| `TF_VAR_backend_image` | Full image reference (with tag) deployed to ECS for the backend. | `123456789012.dkr.ecr.us-east-1.amazonaws.com/debate-backend:phase4` |
| `TF_VAR_frontend_image` | Full image reference (with tag) deployed to ECS for the frontend. | `123456789012.dkr.ecr.us-east-1.amazonaws.com/debate-frontend:phase4` |
| `TF_VAR_backend_ecr_repository` | ECR repository URI (without tag) that stores backend images. | `123456789012.dkr.ecr.us-east-1.amazonaws.com/debate-backend` |
| `TF_VAR_frontend_ecr_repository` | ECR repository URI (without tag) that stores frontend images. | `123456789012.dkr.ecr.us-east-1.amazonaws.com/debate-frontend` |

## Local Development with Docker Compose

1. Copy the `.env.example` values above into a new `.env` file or export them in your shell.
2. Build and start all services:

   ```bash
   docker-compose up --build
   ```

3. Prisma migrations run automatically in the backend container during startup if configured. To manually apply them locally, run:

   ```bash
   docker-compose run --rm backend npx prisma migrate deploy
   ```

4. Access the frontend at [http://localhost:3000](http://localhost:3000) and ensure the backend API and TURN services are reachable.

## Provisioning Cloud Infrastructure

1. Change into the Terraform directory:

   ```bash
   cd infra/terraform
   ```

2. Export or otherwise supply the `TF_VAR_*` variables listed earlier and confirm your AWS credentials are active.

3. Initialize Terraform:

   ```bash
   terraform init
   ```

4. Review the planned changes:

   ```bash
   terraform plan -out=tfplan
   ```

5. Apply the infrastructure:

   ```bash
   terraform apply tfplan
   ```

   This provisions:

   * A dedicated VPC with public/private subnets
   * A managed PostgreSQL (RDS) instance
   * An ECS Fargate cluster running the frontend and backend services behind an Application Load Balancer
   * A CodePipeline + CodeBuild stack that builds and pushes Docker images from GitHub to Amazon ECR

6. Record the Terraform outputs (VPC ID, ALB DNS, database endpoint, pipeline name) for later use.

## CI/CD Workflow

1. Push changes to the configured GitHub repository and branch.
2. CodePipeline retrieves the source through the CodeStar connection and triggers CodeBuild.
3. CodeBuild builds both Docker images using the repository Dockerfiles and pushes them to the ECR repositories defined by `TF_VAR_backend_ecr_repository` and `TF_VAR_frontend_ecr_repository`, tagging them per the buildspec (default `latest`).
4. Upon successful image pushes, update the ECS services by applying Terraform with updated `TF_VAR_backend_image` and `TF_VAR_frontend_image` values that reference the new tags or digests.

## Deployment Steps for Phase 4

1. Ensure Docker images for the targeted release are published to the referenced ECR repositories.
2. Run `terraform apply` with updated image tags to deploy the release to ECS.
3. Verify application health by checking the ALB DNS output and confirming frontend/backed respond as expected.
4. Execute smoke tests for debate creation, participation, and feedback submission.
5. Promote the release by updating DNS records (e.g., Route 53) to point to the ALB and notifying stakeholders of the launch.

## Disaster Recovery & Maintenance

* Enable automatic snapshots for the RDS instance by adjusting `backup_retention_period` in `modules/database` if longer retention is required.
* Scale ECS services by updating the `desired_count` variable in the compute module or overriding it with Terraform variables.
* Rotate credentials (DB password, TURN credentials) via Terraform variables and re-apply to propagate securely stored secrets.

## Additional Notes

* For production, replace static secrets in `docker-compose.yml` with environment variables or secrets management.
* Consider enabling HTTPS for the ALB by provisioning an ACM certificate and modifying the compute module listener.
* The TURN container uses static credentials for simplicity—update to use a secure secret store before launch.
