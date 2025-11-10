output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.this.id
}

output "load_balancer_dns" {
  description = "DNS name of the ALB"
  value       = aws_lb.this.dns_name
}

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "backend_security_group_id" {
  description = "Security group ID assigned to backend tasks"
  value       = aws_security_group.ecs_backend.id
}
