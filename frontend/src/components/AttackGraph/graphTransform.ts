import type { Vulnerability, Patch } from "@/types/battle";

export interface GraphNode {
  id: string;
  label: string;
  type: "endpoint" | "file" | "secret" | "input" | "external" | "attacker";
  risk: "safe" | "risky" | "vulnerable" | "patched";
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "data_flow" | "attack" | "chain";
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface Endpoint {
  path?: string;
  method?: string;
  auth_required?: boolean;
  risk_notes?: string;
}

interface InputVector {
  location?: string;
  type?: string;
  sanitized?: boolean;
}

interface DbQuery {
  file?: string;
  line?: number;
  query_type?: string;
  parameterized?: boolean;
}

interface SecretExposure {
  file?: string;
  key?: string;
  severity?: string;
}

interface ExternalCall {
  file?: string;
  url_pattern?: string;
  user_controlled?: boolean;
}

interface FileHandler {
  file?: string;
  operation?: string;
  path_validated?: boolean;
}

export function transformToGraph(
  attackSurface: Record<string, unknown>,
  vulns: Vulnerability[],
  patches: Patch[],
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  const patchedVulnIds = new Set(patches.filter((p) => p.verified).map((p) => p.vulnerability_id));
  const vulnFiles = new Set(vulns.map((v) => v.file_path));
  const vulnEndpoints = new Set(vulns.map((v) => v.endpoint));

  function addNode(node: GraphNode) {
    if (!nodeIds.has(node.id)) {
      nodeIds.add(node.id);
      nodes.push(node);
    }
  }

  // Attacker node (center)
  addNode({ id: "attacker", label: "ATTACKER", type: "attacker", risk: "vulnerable", val: 8 });

  // Endpoints
  const endpoints = (attackSurface.endpoints as Endpoint[]) || [];
  for (const ep of endpoints) {
    const path = ep.path || "/unknown";
    const id = `ep:${path}`;
    const isVuln = vulnEndpoints.has(path);
    const isPatched = vulns.some((v) => v.endpoint === path && patchedVulnIds.has(v.id));
    addNode({
      id,
      label: `${ep.method || "GET"} ${path}`,
      type: "endpoint",
      risk: isPatched ? "patched" : isVuln ? "vulnerable" : ep.auth_required === false ? "risky" : "safe",
      val: 5,
    });
    links.push({ source: "attacker", target: id, type: "data_flow" });
  }

  // Input vectors
  const inputs = (attackSurface.input_vectors as InputVector[]) || [];
  for (const iv of inputs) {
    const loc = iv.location || "/unknown";
    const id = `input:${loc}`;
    addNode({
      id,
      label: `INPUT ${loc}`,
      type: "input",
      risk: iv.sanitized === false ? "risky" : "safe",
      val: 3,
    });
    // Link input to matching endpoint
    const epId = `ep:${loc}`;
    if (nodeIds.has(epId)) {
      links.push({ source: id, target: epId, type: "data_flow" });
    } else {
      links.push({ source: "attacker", target: id, type: "data_flow" });
    }
  }

  // DB queries
  const queries = (attackSurface.db_queries as DbQuery[]) || [];
  for (const dq of queries) {
    const file = dq.file || "unknown";
    const id = `db:${file}:${dq.line || 0}`;
    const isVuln = vulnFiles.has(file);
    addNode({
      id,
      label: `DB ${file}:${dq.line || "?"}`,
      type: "file",
      risk: isVuln ? "vulnerable" : dq.parameterized === false ? "risky" : "safe",
      val: 4,
    });
    // Link from endpoints to DB
    for (const ep of endpoints) {
      const epId = `ep:${ep.path || "/unknown"}`;
      if (nodeIds.has(epId)) {
        links.push({ source: epId, target: id, type: "data_flow" });
        break; // One link is enough for visual clarity
      }
    }
  }

  // Secret exposures
  const secrets = (attackSurface.secret_exposures as SecretExposure[]) || [];
  for (const sec of secrets) {
    const id = `secret:${sec.file || "unknown"}:${sec.key || ""}`;
    addNode({
      id,
      label: `SECRET ${sec.key || "?"}`,
      type: "secret",
      risk: sec.severity === "critical" ? "vulnerable" : "risky",
      val: 4,
    });
    links.push({ source: "attacker", target: id, type: "attack" });
  }

  // External calls
  const external = (attackSurface.external_calls as ExternalCall[]) || [];
  for (const ec of external) {
    const id = `ext:${ec.file || "unknown"}:${ec.url_pattern || ""}`;
    addNode({
      id,
      label: `EXT ${ec.url_pattern || "?"}`,
      type: "external",
      risk: ec.user_controlled ? "risky" : "safe",
      val: 3,
    });
    const fileNode = `db:${ec.file || "unknown"}:0`;
    if (nodeIds.has(fileNode)) {
      links.push({ source: fileNode, target: id, type: "data_flow" });
    }
  }

  // File handlers
  const handlers = (attackSurface.file_handlers as FileHandler[]) || [];
  for (const fh of handlers) {
    const id = `file:${fh.file || "unknown"}`;
    addNode({
      id,
      label: `FILE ${fh.file || "?"}`,
      type: "file",
      risk: fh.path_validated === false ? "risky" : "safe",
      val: 3,
    });
    for (const ep of endpoints) {
      const epId = `ep:${ep.path || "/unknown"}`;
      if (nodeIds.has(epId)) {
        links.push({ source: epId, target: id, type: "data_flow" });
        break;
      }
    }
  }

  return { nodes, links };
}
