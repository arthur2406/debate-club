output "vpc_id" {
  description = "VPC identifier"
  value       = module.network.vpc_id
}

output "alb_dns" {
  description = "Application load balancer DNS"
  value       = module.compute.load_balancer_dns
}

output "database_endpoint" {
  description = "RDS endpoint"
  value       = module.database.endpoint
}

output "codepipeline_name" {
  description = "Primary CI/CD pipeline"
  value       = module.cicd.pipeline_name
}
