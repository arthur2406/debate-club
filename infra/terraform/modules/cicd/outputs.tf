output "pipeline_name" {
  description = "Name of the CodePipeline pipeline"
  value       = aws_codepipeline.this.name
}

output "artifact_bucket" {
  description = "S3 bucket storing pipeline artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "codebuild_project_name" {
  description = "CodeBuild project triggered by the pipeline"
  value       = aws_codebuild_project.build.name
}
