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
          ];
        };
    });
}
