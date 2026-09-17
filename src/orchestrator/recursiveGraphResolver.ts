export type RecursiveNodeStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'BLOCKED';
export type RecursiveNodeKind = 'PROJECT' | 'MODULE' | 'SUBMODULE' | 'BUILD_UNIT' | 'TASK' | 'TEST';

export interface RecursiveNode {
  id: string;
  name: string;
  kind: RecursiveNodeKind;
  parentId: string | null;
  dependsOn: string[];
  executable: boolean;
}

export interface RecursiveGraph {
  rootId: string;
  preferredModuleOrder?: string[];
  nodes: RecursiveNode[];
}

export type RecursiveStatusMap = Record<string, RecursiveNodeStatus>;

export interface ModuleWorkSummary {
  moduleId: string;
  name: string;
  status: RecursiveNodeStatus;
  readyLeafIds: string[];
  failedLeafIds: string[];
  blockedLeafIds: string[];
}

export type ResolverMode =
  | 'EXECUTE_READY'
  | 'RECOVER_AND_CONTINUE'
  | 'RUN_RCA_RCS'
  | 'WAIT_EXTERNAL'
  | 'COMPLETE'
  | 'DEADLOCK';

export interface ResolverPlan {
  mode: ResolverMode;
  readyLeafIds: string[];
  failedLeafIds: string[];
  blockedLeafIds: string[];
  moduleWork: ModuleWorkSummary[];
}

export interface ResolverCheckpoint {
  version: 1;
  graphRootId: string;
  statuses: RecursiveStatusMap;
  updatedAtUtc: string;
}

const validStatuses = new Set<RecursiveNodeStatus>(['PENDING', 'RUNNING', 'DONE', 'FAILED', 'BLOCKED']);

function byId(graph: RecursiveGraph): Map<string, RecursiveNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

function childrenByParent(graph: RecursiveGraph): Map<string, RecursiveNode[]> {
  const result = new Map<string, RecursiveNode[]>();
  for (const node of graph.nodes) {
    if (!node.parentId) continue;
    const list = result.get(node.parentId) ?? [];
    list.push(node);
    result.set(node.parentId, list);
  }
  return result;
}

export function validateRecursiveGraph(graph: RecursiveGraph): void {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length) throw new Error('Duplicate graph node id');
  if (!ids.has(graph.rootId)) throw new Error(`Missing root node ${graph.rootId}`);

  const root = graph.nodes.find((node) => node.id === graph.rootId)!;
  if (root.parentId !== null) throw new Error('Root node must not have a parent');

  for (const node of graph.nodes) {
    if (node.parentId && !ids.has(node.parentId)) {
      throw new Error(`Missing parent ${node.parentId} for ${node.id}`);
    }
    if (node.parentId === node.id) throw new Error(`Hierarchy self-cycle at ${node.id}`);
    for (const dependency of node.dependsOn) {
      if (!ids.has(dependency)) throw new Error(`Missing dependency ${dependency} for ${node.id}`);
      if (dependency === node.id) throw new Error(`Dependency self-cycle at ${node.id}`);
    }
  }

  const nodes = byId(graph);

  const hierarchyVisiting = new Set<string>();
  const hierarchyVisited = new Set<string>();
  const visitHierarchy = (id: string): void => {
    if (hierarchyVisiting.has(id)) throw new Error(`Hierarchy cycle detected at ${id}`);
    if (hierarchyVisited.has(id)) return;
    hierarchyVisiting.add(id);
    const parentId = nodes.get(id)?.parentId;
    if (parentId) visitHierarchy(parentId);
    hierarchyVisiting.delete(id);
    hierarchyVisited.add(id);
  };
  for (const node of graph.nodes) visitHierarchy(node.id);

  const dependencyVisiting = new Set<string>();
  const dependencyVisited = new Set<string>();
  const visitDependency = (id: string): void => {
    if (dependencyVisiting.has(id)) throw new Error(`Dependency cycle detected at ${id}`);
    if (dependencyVisited.has(id)) return;
    dependencyVisiting.add(id);
    for (const dependency of nodes.get(id)?.dependsOn ?? []) visitDependency(dependency);
    dependencyVisiting.delete(id);
    dependencyVisited.add(id);
  };
  for (const node of graph.nodes) visitDependency(node.id);
}

export function getLeafNodes(graph: RecursiveGraph): RecursiveNode[] {
  validateRecursiveGraph(graph);
  const children = childrenByParent(graph);
  return graph.nodes.filter((node) => node.executable && (children.get(node.id)?.length ?? 0) === 0);
}

export function getDescendantLeafNodes(graph: RecursiveGraph, nodeId: string): RecursiveNode[] {
  validateRecursiveGraph(graph);
  const nodes = byId(graph);
  if (!nodes.has(nodeId)) throw new Error(`Unknown node ${nodeId}`);
  const children = childrenByParent(graph);
  const result: RecursiveNode[] = [];

  const walk = (id: string): void => {
    const childNodes = children.get(id) ?? [];
    if (childNodes.length === 0) {
      const node = nodes.get(id)!;
      if (node.executable) result.push(node);
      return;
    }
    for (const child of childNodes) walk(child.id);
  };

  walk(nodeId);
  return result;
}

export function getUnmetDependencies(node: RecursiveNode, statuses: RecursiveStatusMap): string[] {
  return node.dependsOn.filter((dependency) => statuses[dependency] !== 'DONE');
}

export function resolveReadyLeaves(graph: RecursiveGraph, statuses: RecursiveStatusMap): RecursiveNode[] {
  return getLeafNodes(graph).filter((node) => {
    const status = statuses[node.id] ?? 'PENDING';
    return status === 'PENDING' && getUnmetDependencies(node, statuses).length === 0;
  });
}

function dependencyIsEffectivelyBlocked(
  dependencyId: string,
  graph: RecursiveGraph,
  statuses: RecursiveStatusMap,
  seen = new Set<string>()
): boolean {
  if (seen.has(dependencyId)) return false;
  seen.add(dependencyId);

  const status = statuses[dependencyId] ?? 'PENDING';
  if (status === 'BLOCKED') return true;
  if (status === 'DONE' || status === 'RUNNING' || status === 'FAILED') return false;

  const node = byId(graph).get(dependencyId);
  if (!node || node.dependsOn.length === 0) return false;
  return node.dependsOn.some((dependency) => dependencyIsEffectivelyBlocked(dependency, graph, statuses, seen));
}

export function isEffectivelyBlocked(
  node: RecursiveNode,
  graph: RecursiveGraph,
  statuses: RecursiveStatusMap
): boolean {
  const status = statuses[node.id] ?? 'PENDING';
  if (status === 'BLOCKED') return true;
  if (status !== 'PENDING') return false;
  return node.dependsOn.some((dependency) => dependencyIsEffectivelyBlocked(dependency, graph, statuses));
}

export function aggregateNodeStatus(
  graph: RecursiveGraph,
  nodeId: string,
  statuses: RecursiveStatusMap
): RecursiveNodeStatus {
  const leaves = getDescendantLeafNodes(graph, nodeId);
  if (leaves.length === 0) return statuses[nodeId] ?? 'PENDING';

  const leafStatuses = leaves.map((leaf) => statuses[leaf.id] ?? 'PENDING');
  if (leafStatuses.every((status) => status === 'DONE')) return 'DONE';
  if (leafStatuses.some((status) => status === 'FAILED')) return 'FAILED';
  if (leafStatuses.some((status) => status === 'RUNNING')) return 'RUNNING';

  const unfinishedLeaves = leaves.filter((leaf) => (statuses[leaf.id] ?? 'PENDING') !== 'DONE');
  if (unfinishedLeaves.length > 0 && unfinishedLeaves.every((leaf) => isEffectivelyBlocked(leaf, graph, statuses))) {
    return 'BLOCKED';
  }

  if (leafStatuses.some((status) => status === 'DONE')) return 'RUNNING';
  return 'PENDING';
}

export function resolveModuleWork(graph: RecursiveGraph, statuses: RecursiveStatusMap): ModuleWorkSummary[] {
  validateRecursiveGraph(graph);
  const children = childrenByParent(graph);
  const rootChildren = children.get(graph.rootId) ?? [];
  const modules = rootChildren.filter((node) => node.kind === 'MODULE');
  const readyIds = new Set(resolveReadyLeaves(graph, statuses).map((node) => node.id));

  const summaries = modules.map((module) => {
    const leaves = getDescendantLeafNodes(graph, module.id);
    return {
      moduleId: module.id,
      name: module.name,
      status: aggregateNodeStatus(graph, module.id, statuses),
      readyLeafIds: leaves.filter((leaf) => readyIds.has(leaf.id)).map((leaf) => leaf.id),
      failedLeafIds: leaves.filter((leaf) => statuses[leaf.id] === 'FAILED').map((leaf) => leaf.id),
      blockedLeafIds: leaves.filter((leaf) => isEffectivelyBlocked(leaf, graph, statuses)).map((leaf) => leaf.id)
    } satisfies ModuleWorkSummary;
  });

  const preferred = graph.preferredModuleOrder ?? [];
  return summaries.sort((a, b) => {
    const ai = preferred.indexOf(a.moduleId);
    const bi = preferred.indexOf(b.moduleId);
    if (ai === -1 && bi === -1) return a.moduleId.localeCompare(b.moduleId);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function resolveExecutionPlan(graph: RecursiveGraph, statuses: RecursiveStatusMap): ResolverPlan {
  validateRecursiveGraph(graph);
  const leaves = getLeafNodes(graph);
  const ready = resolveReadyLeaves(graph, statuses);
  const failed = leaves.filter((leaf) => statuses[leaf.id] === 'FAILED');
  const blocked = leaves.filter((leaf) => isEffectivelyBlocked(leaf, graph, statuses));
  const allDone = leaves.every((leaf) => statuses[leaf.id] === 'DONE');
  const unfinished = leaves.filter((leaf) => statuses[leaf.id] !== 'DONE');

  let mode: ResolverMode;
  if (allDone) mode = 'COMPLETE';
  else if (failed.length > 0 && ready.length > 0) mode = 'RECOVER_AND_CONTINUE';
  else if (failed.length > 0) mode = 'RUN_RCA_RCS';
  else if (ready.length > 0) mode = 'EXECUTE_READY';
  else if (unfinished.length > 0 && unfinished.every((leaf) => isEffectivelyBlocked(leaf, graph, statuses))) {
    mode = 'WAIT_EXTERNAL';
  } else {
    mode = 'DEADLOCK';
  }

  return {
    mode,
    readyLeafIds: ready.map((node) => node.id),
    failedLeafIds: failed.map((node) => node.id),
    blockedLeafIds: blocked.map((node) => node.id),
    moduleWork: resolveModuleWork(graph, statuses)
  };
}

export function createCheckpoint(
  graph: RecursiveGraph,
  statuses: RecursiveStatusMap,
  updatedAtUtc = new Date().toISOString()
): ResolverCheckpoint {
  validateRecursiveGraph(graph);
  const ids = new Set(graph.nodes.map((node) => node.id));
  for (const [id, status] of Object.entries(statuses)) {
    if (!ids.has(id)) throw new Error(`Checkpoint contains unknown node ${id}`);
    if (!validStatuses.has(status)) throw new Error(`Checkpoint contains invalid status ${status} for ${id}`);
  }
  return { version: 1, graphRootId: graph.rootId, statuses: { ...statuses }, updatedAtUtc };
}

export function restoreCheckpoint(graph: RecursiveGraph, checkpoint: ResolverCheckpoint): RecursiveStatusMap {
  validateRecursiveGraph(graph);
  if (checkpoint.version !== 1) throw new Error(`Unsupported checkpoint version ${checkpoint.version}`);
  if (checkpoint.graphRootId !== graph.rootId) {
    throw new Error(`Checkpoint root ${checkpoint.graphRootId} does not match graph root ${graph.rootId}`);
  }
  return createCheckpoint(graph, checkpoint.statuses, checkpoint.updatedAtUtc).statuses;
}
