variable "name" {
  description = "Base name for database resources."
  type        = string
}

variable "vpc_id" {
  description = "VPC hosting the database."
  type        = string
}

variable "subnet_ids" {
  description = "Subnets for the RDS subnet group."
  type        = list(string)
}

variable "allocated_storage" {
  description = "Storage size in GB for the database."
  type        = number
  default     = 20
}

variable "engine_version" {
  description = "PostgreSQL engine version."
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "Instance class for RDS."
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "debate_club"
}

variable "username" {
  description = "Database admin username."
  type        = string
}

variable "password" {
  description = "Database admin password."
  type        = string
  sensitive   = true
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access the database."
  type        = list(string)
  default     = []
}

variable "allowed_security_group_ids" {
  description = "List of security groups allowed to reach the database."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags applied to database resources."
  type        = map(string)
  default     = {}
}
