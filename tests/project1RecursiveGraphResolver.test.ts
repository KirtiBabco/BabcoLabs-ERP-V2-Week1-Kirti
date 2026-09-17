import { describe, expect, it } from 'vitest';
import graphJson from '../build/project1-recursive-graph.json';
import {
  aggregateNodeStatus,
  createCheckpoint,
  resolveExecutionPlan,
  resolveReadyLeaves,
  restoreCheckpoint,
  validateRecursiveGraph,
  type RecursiveGraph,
  type RecursiveStatusMap
} from '../src/orchestrator/recursiveGraphResolver';

const graph = graphJson as RecursiveGraph;
const foundationDone: RecursiveStatusMap = {
  'M0.1': 'DONE',
  'M0.2': 'DONE',
  'M0.3': 'DONE'
};

describe('Project 1 recursive graph resolver', () => {
  it('validates the declared recursive graph', () => {
    expect(() => validateRecursiveGraph(graph)).not.toThrow();
  });

  it('starts with only the first foundation leaf', () => {
    expect(resolveReadyLeaves(graph, {}).map((node) => node.id)).toEqual(['M0.1']);
  });

  it('opens independent Database, Contract, and Data Access work after foundation', () => {
    const ready = resolveReadyLeaves(graph, foundationDone).map((node) => node.id);
    expect(ready).toEqual(expect.arrayContaining([
      'M1.1.1',
      'M1.2.1',
      'M2.1.1',
      'M2.1.2',
      'M2.3.1',
      'M3.1.1'
    ]));
  });

  it('continues Contract work when a Database leaf is externally blocked', () => {
    const statuses: RecursiveStatusMap = {
      ...foundationDone,
      'M1.1.1': 'BLOCKED'
    };
    const plan = resolveExecutionPlan(graph, statuses);
    expect(plan.mode).toBe('EXECUTE_READY');
    expect(plan.readyLeafIds).toContain('M2.1.1');
    expect(plan.readyLeafIds).toContain('M2.1.2');
    expect(plan.readyLeafIds).toContain('M3.1.1');
    expect(plan.blockedLeafIds).toContain('M1.1.1');
  });

  it('does not unlock POST until Database, Contract, and SQL access gates are done', () => {
    const partial: RecursiveStatusMap = {
      ...foundationDone,
      'M1.1.1': 'DONE',
      'M1.1.2': 'DONE',
      'M1.2.1': 'DONE',
      'M1.2.2': 'DONE',
      'M1.3.1': 'DONE',
      'M1.3.2': 'DONE',
      'M1.4.1': 'DONE',
      'M1.4.2': 'DONE',
      'M2.1.1': 'DONE',
      'M2.1.2': 'DONE',
      'M2.2.1': 'DONE',
      'M2.2.2': 'DONE',
      'M2.3.1': 'DONE',
      'M2.3.2': 'DONE',
      'M2.4.1': 'DONE',
      'M3.1.1': 'DONE'
    };

    expect(resolveReadyLeaves(graph, partial).map((node) => node.id)).toContain('M3.1.2');
    expect(resolveReadyLeaves(graph, partial).map((node) => node.id)).not.toContain('M3.2.1');

    partial['M3.1.2'] = 'DONE';
    const readyAfterSqlGate = resolveReadyLeaves(graph, partial).map((node) => node.id);
    expect(readyAfterSqlGate).toContain('M3.2.1');
    expect(readyAfterSqlGate).toContain('M3.3.1');
  });

  it('runs RCA/RCS recovery while independent ready work can continue', () => {
    const statuses: RecursiveStatusMap = {
      ...foundationDone,
      'M1.1.1': 'FAILED'
    };
    const plan = resolveExecutionPlan(graph, statuses);
    expect(plan.mode).toBe('RECOVER_AND_CONTINUE');
    expect(plan.failedLeafIds).toEqual(['M1.1.1']);
    expect(plan.readyLeafIds).toContain('M2.1.1');
  });

  it('aggregates module progress from descendant leaves', () => {
    expect(aggregateNodeStatus(graph, 'M0', foundationDone)).toBe('DONE');
    expect(aggregateNodeStatus(graph, 'M1', foundationDone)).toBe('PENDING');

    const started: RecursiveStatusMap = { ...foundationDone, 'M1.1.1': 'DONE' };
    expect(aggregateNodeStatus(graph, 'M1', started)).toBe('RUNNING');
  });

  it('persists and restores progress across a forced restart', () => {
    const statuses: RecursiveStatusMap = {
      ...foundationDone,
      'M1.1.1': 'DONE',
      'M1.1.2': 'DONE',
      'M2.1.1': 'RUNNING'
    };
    const checkpoint = createCheckpoint(graph, statuses, '2026-09-17T12:00:00Z');
    const restored = restoreCheckpoint(graph, JSON.parse(JSON.stringify(checkpoint)));
    expect(restored).toEqual(statuses);
    expect(resolveExecutionPlan(graph, restored).readyLeafIds).toContain('M1.2.1');
  });

  it('rejects invalid cyclic dependencies before execution', () => {
    const badGraph: RecursiveGraph = {
      rootId: 'P',
      nodes: [
        { id: 'P', name: 'P', kind: 'PROJECT', parentId: null, dependsOn: [], executable: false },
        { id: 'A', name: 'A', kind: 'TASK', parentId: 'P', dependsOn: ['B'], executable: true },
        { id: 'B', name: 'B', kind: 'TASK', parentId: 'P', dependsOn: ['A'], executable: true }
      ]
    };
    expect(() => validateRecursiveGraph(badGraph)).toThrow(/Dependency cycle/);
  });
});
