variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "name" {
  description = "Project name prefix applied to resources."
  type        = string
  default     = "debate-club"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "db_username" {
  description = "Master username for PostgreSQL."
  type        = string
}

variable "db_password" {
  description = "Master password for PostgreSQL."
  type        = string
  sensitive   = true
}

variable "codestar_connection_arn" {
  description = "CodeStar connection ARN used by the pipeline."
  type        = string
}

variable "github_owner" {
  description = "GitHub owner for CI/CD integration."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository for CI/CD integration."
  type        = string
}

variable "github_branch" {
  description = "Branch to deploy from."
  type        = string
  default     = "main"
}

variable "backend_image" {
  description = "Fully qualified container image (including tag) for backend deployments."
  type        = string
}

variable "frontend_image" {
  description = "Fully qualified container image (including tag) for frontend deployments."
  type        = string
}

variable "backend_ecr_repository" {
  description = "ECR repository URI used by the CI pipeline for backend images (no tag)."
  type        = string
}

variable "frontend_ecr_repository" {
  description = "ECR repository URI used by the CI pipeline for frontend images (no tag)."
  type        = string
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
