import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards against the React "Rendered more hooks than during the previous render"
 * crash that took down the Billing page: a hook must never appear after an
 * early `return` inside a component.
 */

const HOOK_RE = /\buse(State|Effect|Memo|Callback|Ref|Context|Reducer|LayoutEffect)\s*\(/;
const EARLY_RETURN_RE = /^\s{2}if\s*\(.*\)\s*return\s/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(p)) out.push(p);
  }
  return out;
}

function hooksAfterEarlyReturn(source: string): string[] {
  const lines = source.split("\n");
  const offenders: string[] = [];
  let seenEarlyReturn = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Reset at the start of every top-level component/function declaration.
    if (/^(const|function|export)\s/.test(line)) seenEarlyReturn = false;
    if (EARLY_RETURN_RE.test(line)) seenEarlyReturn = true;
    if (seenEarlyReturn && HOOK_RE.test(line) && !line.trim().startsWith("//")) {
      offenders.push(`line ${i + 1}: ${line.trim()}`);
    }
  }
  return offenders;
}

describe("hook safety", () => {
  it("detects a hook placed after an early return", () => {
    const bad = [
      "const C = () => {",
      "  const [a, setA] = useState(0);",
      "  if (loading) return <Skeleton />;",
      "  const b = useMemo(() => a, [a]);",
      "  return <div />;",
      "};",
    ].join("\n");
    expect(hooksAfterEarlyReturn(bad)).toHaveLength(1);
  });

  it("accepts hooks declared before the early return", () => {
    const good = [
      "const C = () => {",
      "  const [a, setA] = useState(0);",
      "  const b = useMemo(() => a, [a]);",
      "  if (loading) return <Skeleton />;",
      "  return <div>{b}</div>;",
      "};",
    ].join("\n");
    expect(hooksAfterEarlyReturn(good)).toHaveLength(0);
  });

  it("has no hook after an early return anywhere in src/pages or src/components", () => {
    const files = [...walk("src/pages"), ...walk("src/components")];
    const problems: string[] = [];
    for (const file of files) {
      const found = hooksAfterEarlyReturn(readFileSync(file, "utf8"));
      if (found.length) problems.push(`${file} -> ${found.join("; ")}`);
    }
    expect(problems).toEqual([]);
  });

  it("keeps the Billing page hooks above its loading return", () => {
    const src = readFileSync("src/pages/dashboard/Billing.tsx", "utf8");
    const lines = src.split("\n");
    const loadingReturn = lines.findIndex((l) => /if \(loading\) return/.test(l));
    expect(loadingReturn).toBeGreaterThan(-1);
    const after = lines.slice(loadingReturn + 1).filter((l) => HOOK_RE.test(l));
    expect(after).toEqual([]);
  });
});
