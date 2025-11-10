variable "name" {
  description = "Base name for CI/CD resources."
  type        = string
}

variable "github_owner" {
  description = "GitHub organization or user owning the repository."
  type        = string
}

variable "github_repo" {
  description = "Repository name hosting the application source."
  type        = string
}

variable "github_branch" {
  description = "Default branch to track for deployments."
  type        = string
  default     = "main"
}

variable "codestar_connection_arn" {
  description = "ARN of the CodeStar connection used by CodePipeline."
  type        = string
}

variable "ecr_backend_repository_url" {
  description = "ECR repository URL for backend images."
  type        = string
}

variable "ecr_frontend_repository_url" {
  description = "ECR repository URL for frontend images."
  type        = string
}

variable "tags" {
  description = "Common tags applied to CI/CD resources."
  type        = map(string)
  default     = {}
}
