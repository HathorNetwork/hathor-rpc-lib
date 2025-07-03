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
          nodejs = final.nodejs_20;
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
            nodejs_20
            yarn-berry
          ];
          devshell = {
            startup.shell-hook.text = ''
              if ! command -v claude >/dev/null 2>&1; then
                echo "Installing @anthropic-ai/claude-code..."
                npm install -g @anthropic-ai/claude-code
              fi
              export PATH="$(npm config get prefix)/bin:$PATH"
            '';
          };
        };
    });
}
