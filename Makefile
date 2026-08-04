# Makefile for Docker Compose project management

# Default Docker Compose command
DOCKER_COMPOSE=docker compose

# Compose file and project name
COMPOSE_FILE=docker-compose.yml
PROJECT_NAME=fantasy_app

# Commands

.PHONY: build up start stop down logs restart clean help

# Build the services
build:
	@echo "Building services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) build

# Build the services (no cache)
build-no-cache:
	@echo "Building services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) build --no-cache

# Start the services in detached mode
up:
	@echo "Starting services in detached mode..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up -d

# Stop the services (keep containers)
stop:
	@echo "Stopping services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) stop

# Stop and remove all containers and networks
down:
	@echo "Bringing down services and removing containers..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down

# Show logs for all services
logs:
	@echo "Showing logs for all services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) logs -f

# Restart the services
restart:
	@echo "Restarting services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) restart

# Remove all stopped containers, unused networks, and unused images
clean:
	@echo "Cleaning up unused Docker resources..."
	docker system prune -f

# Fully reset containers, volumes, and networks, and rebuild everything
reset:
	@echo "Fully resetting containers, volumes, and networks..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down --volumes --remove-orphans
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up --build -d

# Production is a single Next.js Cloud Run service.
deploy:
	@echo "Deploying Frontend to Cloud Run..."
	$(MAKE) -C frontend deploy

deploy-gha:
	@echo "Deploying Frontend..."
	$(MAKE) -C frontend deploy || { echo "Frontend deploy failed"; cat frontend.log; exit 1; }
	@echo "Frontend deployment finished successfully."

# Help menu
help:
	@echo "Makefile commands for managing Docker Compose project:"
	@echo "  build   - Build the services"
	@echo "  build-no-cache - Build the services without cache"
	@echo "  up      - Start services in detached mode"
	@echo "  start   - Start services in foreground mode"
	@echo "  stop    - Stop the services (containers kept)"
	@echo "  down    - Stop and remove all containers and networks"
	@echo "  logs    - Show logs for all services"
	@echo "  restart - Restart all services"
	@echo "  clean   - Clean up unused Docker resources"
	@echo "  reset   - Fully reset containers, volumes, and networks, and rebuild everything"
	@echo "  deploy  - Deploy the Next.js app to Google Cloud Run"
