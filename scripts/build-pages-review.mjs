import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = join(root, "out");
const stage = await mkdtemp(join(tmpdir(), "kingsword-pages-"));
const basePath = process.env.PAGES_BASE_PATH ?? "/seven-module-lms";
if (!/^\/[a-z0-9-]+$/i.test(basePath)) throw new Error("Invalid GitHub Pages base path.");

async function edit(path, transform) {
  const file = join(stage, path);
  const original = await readFile(file, "utf8");
  const updated = transform(original);
  if (original === updated) throw new Error(`Review configuration no longer matches ${path}`);
  await writeFile(file, updated);
}

try {
  for (const path of ["src", "public", "package.json", "tsconfig.json", "postcss.config.mjs"]) {
    await cp(join(root, path), join(stage, path), { recursive: true });
  }
  await symlink(join(root, "node_modules"), join(stage, "node_modules"), "dir");
  await edit("tsconfig.json", (source) => {
    const config = JSON.parse(source);
    config.include = ["next-env.d.ts", "src/app/**/*.tsx", ".next/types/**/*.ts"];
    return JSON.stringify(config, null, 2);
  });

  // Publish only routes intended for anonymous review.
  const publicEntries = new Set([
    "about", "believers-training", "children", "contact", "curriculum", "explore",
    "locations", "privacy", "globals.css", "kingsword.css", "layout.tsx", "page.tsx",
  ]);
  for (const entry of await readdir(join(stage, "src/app"))) {
    if (!publicEntries.has(entry)) await rm(join(stage, "src/app", entry), { recursive: true });
  }

  await writeFile(join(stage, "next.config.mjs"), `export default {
    output: "export",
    trailingSlash: true,
    basePath: ${JSON.stringify(basePath)},
    images: { loader: "custom", loaderFile: "./review-image-loader.ts" },
  };\n`);
  await writeFile(join(stage, "review-image-loader.ts"),
    `export default function loader({ src }: { src: string }) {
      return src.startsWith("/") ? ${JSON.stringify(basePath)} + src : src;
    }\n`);

  await edit("src/lib/public-context.ts", (source) => source
    .replace('import { headers } from "next/headers";\n', "")
    .replace("locationByHost, NETWORK, normalizeHost,", "NETWORK,")
    .replace(/  const host = [\s\S]*?\n\}\);/, '  return { basePath: "", customDomain: false };\n});'));
  await edit("src/app/locations/[slug]/[[...page]]/page.tsx", (source) =>
    source.replace("import { locationBySlug,", "import { LOCATIONS, locationBySlug,") +
    `\nexport function generateStaticParams() {
      return LOCATIONS.flatMap(({ slug }) =>
        [[], ["about"], ["contact"], ["children"]].map((page) => ({ slug, page })),
      );
    }\n`);
  await edit("src/lib/public-program.ts", (source) => source
    .replace('import { db } from "@/lib/db";\n', "")
    .replace(/  try \{[\s\S]*$/, "  return fallbackProgram;\n}\n"));
  for (const page of ["believers-training", "curriculum"]) {
    await edit(`src/app/${page}/page.tsx`, (source) => source.replace('export const dynamic = "force-dynamic";\n', ""));
  }
  await edit("src/components/location-globe.tsx", (source) =>
    source.replaceAll('"/geo/', `"${basePath}/geo/`));

  // Give links to the protected app a clear destination in the review copy.
  for (const route of ["login", "signup", "apply", "final-assessment", "ministers/login"]) {
    const directory = join(stage, "src/app", route);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "page.tsx"), `import Link from "next/link";

export default function Page() {
  return (
    <main className="page-shell max-w-3xl py-24">
      <h1 className="display text-5xl">KingsWord website preview</h1>
      <p className="my-6">Student and minister accounts are available through the live training portal.</p>
      <Link href="/believers-training" className="button-primary">Explore Believers Training</Link>
    </main>
  );
}
`);
  }
  await edit("src/app/layout.tsx", (source) =>
    source.replace("  description: NETWORK.description,", "  description: NETWORK.description,\n  robots: { index: false, follow: false },"));

  execFileSync(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], {
    cwd: stage,
    env: { ...process.env, APP_URL: "https://kaysongt.github.io", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "inherit",
  });
  await rm(output, { recursive: true, force: true });
  await cp(join(stage, "out"), output, { recursive: true });
  await writeFile(join(output, ".nojekyll"), "");
} finally {
  await rm(stage, { recursive: true, force: true });
}
