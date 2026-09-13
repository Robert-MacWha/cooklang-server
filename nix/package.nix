{
  lib,
  buildNpmPackage,
  nodejs,
  makeWrapper,
}:

buildNpmPackage {
  pname = "cooklang-server";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../src
      ../static
      ../package.json
      ../package-lock.json
      ../vite.config.ts
      ../tsconfig.json
      ../.npmrc
    ];
  };

  npmDepsHash = "sha256-pJzIMXtjBxH9UgThBSkKkOuoAnLuTDtXbwYQ388DGL4=";

  inherit nodejs;

  # Only @cooklang/cooklang is a real runtime dependency - everything else in
  # node_modules after `npm ci` is build-only (svelte, vite, tailwind, ...).
  installPhase = ''
    runHook preInstall

    npm prune --omit=dev

    mkdir -p $out/lib/cooklang-server
    cp -r build $out/lib/cooklang-server/build
    cp -r node_modules $out/lib/cooklang-server/node_modules
    cp package.json $out/lib/cooklang-server/package.json

    runHook postInstall
  '';

  nativeBuildInputs = [ makeWrapper ];

  postFixup = ''
    makeWrapper ${lib.getExe nodejs} $out/bin/cooklang-server \
      --add-flags "$out/lib/cooklang-server/build/index.js"
  '';

  meta = {
    description = "Minimal cooklang recipe server";
    mainProgram = "cooklang-server";
  };
}
