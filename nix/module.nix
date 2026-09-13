self:
{
  config,
  lib,
  pkgs,
  ...
}:

let
  cfg = config.services.cooklang-server;
  recipesDir = "/var/lib/cooklang-server/recipes";
in
{
  options.services.cooklang-server = {
    enable = lib.mkEnableOption "the cooklang-server recipe web app";

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${pkgs.system}.default;
      description = "The cooklang-server package to run.";
    };

    repo = lib.mkOption {
      type = lib.types.str;
      description = "Git URL of the recipes repository. Recipes are hard-reset to this repo on a timer.";
      example = "https://github.com/you/recipes.git";
    };

    ref = lib.mkOption {
      type = lib.types.str;
      default = "main";
      description = "Branch or ref to track.";
    };

    syncInterval = lib.mkOption {
      type = lib.types.str;
      default = "hourly";
      description = "systemd calendar expression for how often to re-sync recipes from the repo.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 3000;
      description = "Port to listen on.";
    };

    host = lib.mkOption {
      type = lib.types.str;
      default = "0.0.0.0";
      description = "Address to listen on.";
    };

    openFirewall = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Whether to open the configured port in the firewall.";
    };
  };

  config = lib.mkIf cfg.enable {
    users.users.cooklang-server = {
      isSystemUser = true;
      group = "cooklang-server";
    };
    users.groups.cooklang-server = { };

    systemd.services.cooklang-server = {
      description = "cooklang-server recipe web app";
      wantedBy = [ "multi-user.target" ];
      after = [
        "network.target"
        "cooklang-server-recipes-sync.service"
      ];
      wants = [ "cooklang-server-recipes-sync.service" ];

      environment = {
        RECIPES_DIR = recipesDir;
        PORT = toString cfg.port;
        HOST = cfg.host;
      };

      serviceConfig = {
        ExecStart = lib.getExe cfg.package;
        User = "cooklang-server";
        Group = "cooklang-server";
        Restart = "on-failure";

        # Node's JIT needs W+X pages, so MemoryDenyWriteExecute is deliberately not set.
        CapabilityBoundingSet = [ "" ] ++ lib.optional (cfg.port < 1024) "CAP_NET_BIND_SERVICE";
        AmbientCapabilities = lib.optional (cfg.port < 1024) "CAP_NET_BIND_SERVICE";
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectClock = true;
        ProtectHostname = true;
        ProtectKernelLogs = true;
        ProtectKernelModules = true;
        ProtectKernelTunables = true;
        ProtectControlGroups = true;
        ProtectProc = "invisible";
        ProcSubset = "pid";
        RestrictAddressFamilies = [
          "AF_INET"
          "AF_INET6"
        ];
        RestrictNamespaces = true;
        RestrictRealtime = true;
        RestrictSUIDSGID = true;
        LockPersonality = true;
        RemoveIPC = true;
        UMask = "0077";
        SystemCallArchitectures = "native";
        SystemCallFilter = [
          "@system-service"
          "~@privileged"
          "~@resources"
        ];
      };
    };

    systemd.services.cooklang-server-recipes-sync = {
      description = "Hard-reset cooklang-server recipes to ${cfg.repo}";
      path = [ pkgs.git ];

      script = ''
        set -euo pipefail
        if [ -d "${recipesDir}/.git" ]; then
          git -C "${recipesDir}" fetch --depth 1 origin "${cfg.ref}"
          git -C "${recipesDir}" reset --hard "origin/${cfg.ref}"
          git -C "${recipesDir}" clean -fdx
        else
          rm -rf "${recipesDir}"
          git clone --depth 1 --branch "${cfg.ref}" "${cfg.repo}" "${recipesDir}"
        fi
      '';

      serviceConfig = {
        Type = "oneshot";
        User = "cooklang-server";
        Group = "cooklang-server";
        StateDirectory = "cooklang-server/recipes";

        CapabilityBoundingSet = [ "" ];
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectClock = true;
        ProtectHostname = true;
        ProtectKernelLogs = true;
        ProtectKernelModules = true;
        ProtectKernelTunables = true;
        ProtectControlGroups = true;
        ProtectProc = "invisible";
        ProcSubset = "pid";
        RestrictAddressFamilies = [
          "AF_INET"
          "AF_INET6"
          "AF_UNIX"
        ];
        RestrictNamespaces = true;
        RestrictRealtime = true;
        RestrictSUIDSGID = true;
        LockPersonality = true;
        RemoveIPC = true;
        UMask = "0077";
        SystemCallArchitectures = "native";
        SystemCallFilter = [
          "@system-service"
          "~@privileged"
          "~@resources"
        ];
      };
    };

    systemd.timers.cooklang-server-recipes-sync = {
      description = "Periodic timer for cooklang-server-recipes-sync";
      wantedBy = [ "timers.target" ];
      timerConfig = {
        OnCalendar = cfg.syncInterval;
        Persistent = true;
      };
    };

    networking.firewall.allowedTCPPorts = lib.mkIf cfg.openFirewall [ cfg.port ];
  };
}
