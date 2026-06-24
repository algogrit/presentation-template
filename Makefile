.DEFAULT_GOAL := help

.PHONY: help install create sync check preview html pdf pptx lint lint-dense clean

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\nTargets:\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm ci

create: ## Create a deck repository; requires TITLE, accepts extra ARGS
	@test -n "$(TITLE)" || (echo 'Usage: make create TITLE="Talk Title" [ARGS='"'"'--description "..."'"'"']' && exit 1)
	npm run create-deck -- --title "$(TITLE)" $(ARGS)

sync: ## Synchronize generated files from deck.config.json
	npm run deck:sync

check: ## Validate deck metadata
	npm run deck:check

preview: ## Start the live Marp preview
	npm run preview

html: ## Export the HTML deck
	npm run html

pdf: ## Export the PDF deck
	npm run pdf

pptx: ## Export the PowerPoint deck
	npm run pptx

lint: ## Validate metadata and check slide overflow
	npm run lint

lint-dense: ## Also report dense-but-fitting slides
	npm run lint -- --dense

clean: ## Remove generated output
	rm -rf dist themes/base.css
