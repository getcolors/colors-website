// Build-time guard: an og:image must actually exist in public/.
//
// Every card on the site is a file named by a rule -- catalog cards from
// catalogOgImage(), article cards by hand -- and nothing checked that the file
// the rule names had ever been generated. Twenty-two catalog cards were
// referenced by built pages and had never been committed, so those unfurls
// fetched a 404 for as long as the recipes had existed. Adding a recipe
// requires rerunning scripts/generate-og-image.py, and that step was skipped
// every time, silently, because a missing image breaks nothing at build.
//
// This is the one thing standing between "the generator was not run" and a
// broken social card in production, so it fails the build rather than warning.

import { existsSync } from "node:fs";
import { join } from "node:path";

const checked = new Set<string>();

/** Throw unless `candidate` names a file in public/. Remote URLs are somebody
 *  else's to serve and are skipped; results are memoised because this runs
 *  once per rendered page. */
export function requireLocalImage(candidate: string): void {
  if (/^https?:\/\//.test(candidate) || checked.has(candidate)) return;
  checked.add(candidate);
  if (!existsSync(join(process.cwd(), "public", candidate.replace(/^\//, "")))) {
    throw new Error(
      `og:image ${candidate} is referenced but missing from public/. ` +
        `Catalog and article cards are generated -- run ` +
        `scripts/generate-og-image.py (see the setup block at the top of it).`,
    );
  }
}
