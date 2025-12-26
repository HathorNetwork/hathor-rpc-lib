{
  description = "virtual environments";

  inputs = {
    devshell.url = "github:numtide/devshell";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, flake-utils, devshell, nixpkgs, ... }@inputs:
    let
      overlays.default = final: prev:
        let
          packages = self.packages.${final.system};
          inherit (packages) node-packages;
        in
        {
          nodejs = final.nodejs_22;
          nodePackages = prev.nodePackages;
        };
    in
    flake-utils.lib.eachDefaultSystem (system: {
      devShell =
        let pkgs = import nixpkgs {
          inherit system;

          overlays = [
            devshell.overlays.default
            overlays.default
          ];
        };
        in
        pkgs.devshell.mkShell {
          packages = with pkgs; [
            nixpkgs-fmt
            nodejs_22
            yarn-berry
            awscli2
          ];

          commands = [
            {
              name = "web-wallet-build";
              help = "Build web-wallet for a site (staging or production)";
              command = ''
                if [ -z "$1" ]; then
                  echo "Usage: web-wallet-build <site>"
                  echo "Available sites: staging, production"
                  return 1
                fi
                ./packages/web-wallet/scripts/deploy.sh "$1" build "''${2:-}"
              '';
            }
            {
              name = "web-wallet-sync";
              help = "Sync web-wallet build to S3 for a site";
              command = ''
                if [ -z "$1" ]; then
                  echo "Usage: web-wallet-sync <site> [aws_profile]"
                  echo "Available sites: staging, production"
                  return 1
                fi
                ./packages/web-wallet/scripts/deploy.sh "$1" sync "''${2:-}"
              '';
            }
            {
              name = "web-wallet-clear-cache";
              help = "Invalidate CloudFront cache for a site";
              command = ''
                if [ -z "$1" ]; then
                  echo "Usage: web-wallet-clear-cache <site> [aws_profile]"
                  echo "Available sites: staging, production"
                  return 1
                fi
                ./packages/web-wallet/scripts/deploy.sh "$1" clear_cache "''${2:-}"
              '';
            }
            {
              name = "web-wallet-deploy";
              help = "Full deploy: build, sync to S3, and invalidate CloudFront cache";
              command = ''
                if [ -z "$1" ]; then
                  echo "Usage: web-wallet-deploy <site> [aws_profile]"
                  echo "Available sites: staging, production"
                  return 1
                fi
                site="$1"
                aws_profile="''${2:-}"
                ./packages/web-wallet/scripts/deploy.sh "$site" build "$aws_profile" && \
                ./packages/web-wallet/scripts/deploy.sh "$site" sync "$aws_profile" && \
                ./packages/web-wallet/scripts/deploy.sh "$site" clear_cache "$aws_profile"
              '';
            }
          ];
        };
    });
}
