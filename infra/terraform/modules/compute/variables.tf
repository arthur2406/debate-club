variable "name" {
  description = "Base name for compute resources."
  type        = string
}

variable "vpc_id" {
  description = "VPC where compute resources will be deployed."
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnets used by the load balancer."
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Private subnets used by ECS services."
  type        = list(string)
}

variable "backend_image" {
  description = "Container image for the backend service."
  type        = string
}

variable "frontend_image" {
  description = "Container image for the frontend service."
  type        = string
}

variable "container_port_backend" {
  description = "Port exposed by the backend container."
  type        = number
  default     = 4000
}

variable "container_port_frontend" {
  description = "Port exposed by the frontend container."
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Number of desired ECS tasks for each service."
  type        = number
  default     = 2
}

variable "environment" {
  description = "Environment variables for the backend container."
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Common tags to apply to resources."
  type        = map(string)
  default     = {}
}
