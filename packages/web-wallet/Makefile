.PHONY: build
build:
	./scripts/deploy.sh $(site) build $(aws_profile)

.PHONY: sync
sync:
	./scripts/deploy.sh $(site) sync $(aws_profile)

.PHONY: deploy
deploy: build sync clear_cloudfront_cache

.PHONY: clear_cloudfront_cache
clear_cloudfront_cache:
	./scripts/deploy.sh $(site) clear_cache $(aws_profile)
