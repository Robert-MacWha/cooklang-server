# cooklang-server

> NOTE: This server was primarily vibe-coded with heavy use of claude code and built for personal use.

A minimal recipe web server for browsing [cooklang](https://cooklang.org) recipes.

## NixOS

Add as a flake input and enable the service:

```nix
{
  inputs.cooklang-server.url = "github:Robert-MacWha/cooklang-server";

  outputs = { nixpkgs, cooklang-server, ... }: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      modules = [
        cooklang-server.nixosModules.default
        {
          services.cooklang-server = {
            enable = true;
            port = 3000;
            openFirewall = true;

            # Recipes live in /var/lib/cooklang-server/recipes, hard-reset
            # from this repo on a timer.
            repo = "https://github.com/<you>/recipes.git";
            ref = "main";
            syncInterval = "hourly";
          };
        }
      ];
    };
  };
}
```

## Development

```sh
nix develop
npm install
npm run dev
```

`RECIPES_DIR` (env var, default `./recipes`) controls where recipes are loaded from.

```sh
npm run check
npm run build
```
