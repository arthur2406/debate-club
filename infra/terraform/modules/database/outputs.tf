output "endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.this.address
}

output "port" {
  description = "Database port"
  value       = aws_db_instance.this.port
}

output "security_group_id" {
  description = "Security group protecting the database"
  value       = aws_security_group.db.id
}

output "db_name" {
  description = "Name of the created database"
  value       = aws_db_instance.this.db_name
}
