/**
 * Minimal robots.txt support (§5.4 step 2, §7.9).
 * Follows the common conventions (RFC 9309): the most specific matching
 * User-agent group wins; within it, the longest matching Allow/Disallow rule wins;
 * on a tie, Allow wins. `*` and `$` wildcards are supported.
 */

interface Rule {
  allow: boolean;
  pattern: string;
}

export interface RobotsPolicy {
  /** null = no robots.txt (everything allowed). "deny-all" = robots.txt unreachable. */
  groups: Map<string, Rule[]> | null | "deny-all";
}

export function parseRobots(text: string): Map<string, Rule[]> {
  const groups = new Map<string, Rule[]>();
  let currentAgents: string[] = [];
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();

    if (field === "user-agent") {
      if (!lastWasAgent) currentAgents = [];
      currentAgents.push(value.toLowerCase());
      if (!groups.has(value.toLowerCase())) groups.set(value.toLowerCase(), []);
      lastWasAgent = true;
    } else if (field === "allow" || field === "disallow") {
      lastWasAgent = false;
      // An empty Disallow means "allow everything" and adds no rule.
      if (!value) continue;
      for (const agent of currentAgents) {
        groups.get(agent)!.push({ allow: field === "allow", pattern: value });
      }
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

function patternToRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/** Is `path` (pathname + search) allowed for `agentToken`? */
export function isAllowed(policy: RobotsPolicy, agentToken: string, path: string): boolean {
  if (policy.groups === null) return true;
  if (policy.groups === "deny-all") return false;

  const token = agentToken.toLowerCase();
  // Most specific group: an agent line contained in our token, else "*".
  const agentKey =
    [...policy.groups.keys()]
      .filter((agent) => agent !== "*" && token.includes(agent))
      .sort((a, b) => b.length - a.length)[0] ?? (policy.groups.has("*") ? "*" : null);
  if (agentKey === null) return true;

  let best: Rule | null = null;
  for (const rule of policy.groups.get(agentKey)!) {
    if (!patternToRegex(rule.pattern).test(path)) continue;
    if (
      best === null ||
      rule.pattern.length > best.pattern.length ||
      (rule.pattern.length === best.pattern.length && rule.allow)
    ) {
      best = rule;
    }
  }
  return best === null || best.allow;
}
