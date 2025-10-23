# Makefile for rpc-lib
# Targets:
#   make clean        - remove node_modules and dist in root and packages/*
#   make clean-root   - remove node_modules and dist in repo root
#   make clean-packages - remove node_modules and dist in each package under packages/
#   make build        - build all packages
#   make start        - start the snaps package

.PHONY: clean clean-root clean-packages build start

clean: clean-root clean-packages
	@echo "Clean complete."

clean-root:
	@echo "Removing root node_modules and dist (if present)..."
	@rm -rf node_modules || true
	@rm -rf dist || true

clean-packages:
	@echo "Removing node_modules and dist in packages/* (if present)..."
	@# Find and remove node_modules and dist directories under packages (recursive)
	@find packages -type d \( -name node_modules -o -name dist \) -print -exec rm -rf '{}' + || true

build:
	@echo "Installing dependencies with Yarn..."
	@yarn
	@echo "Building all packages..."
	@yarn workspaces foreach -A run build

start:
	@echo "Starting snaps package"
	@yarn workspace @hathor/snap start
