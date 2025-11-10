provider "aws" {
  region = var.aws_region
}

module "network" {
  source               = "./modules/network"
  name                 = var.name
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags                 = var.tags
}

module "database" {
  source                     = "./modules/database"
  name                       = var.name
  vpc_id                     = module.network.vpc_id
  subnet_ids                 = module.network.private_subnet_ids
  username                   = var.db_username
  password                   = var.db_password
  allowed_cidr_blocks        = []
  allowed_security_group_ids = []
  tags                       = var.tags
}

module "compute" {
  source             = "./modules/compute"
  name               = var.name
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  backend_image      = var.backend_image
  frontend_image     = var.frontend_image
  environment = {
    DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${module.database.endpoint}:${module.database.port}/${module.database.db_name}"
  }
  tags = var.tags
}

resource "aws_security_group_rule" "db_from_backend" {
  description              = "Allow backend ECS tasks to reach PostgreSQL"
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = module.database.security_group_id
  source_security_group_id = module.compute.backend_security_group_id
}

module "cicd" {
  source                      = "./modules/cicd"
  name                        = var.name
  github_owner                = var.github_owner
  github_repo                 = var.github_repo
  github_branch               = var.github_branch
  codestar_connection_arn     = var.codestar_connection_arn
  ecr_backend_repository_url  = var.backend_ecr_repository
  ecr_frontend_repository_url = var.frontend_ecr_repository
  tags                        = var.tags
}
