import { describe, expect, it } from 'vitest';
import graph from '../build/week1-graph.json';
import { canStop, resolveReadyUnits, type BuildUnit, type StatusMap } from '../src/orchestrator/graphResolver';

const units = graph.units as BuildUnit[];

describe('Week 1 dependency graph resolver', () => {
  it('starts with repository bootstrap only', () => {
    const ready = resolveReadyUnits(units, {});
    expect(ready.map((u) => u.id)).toEqual(['0.1']);
  });

  it('unlocks runtime after repository bootstrap', () => {
    const statuses: StatusMap = { '0.1': 'DONE' };
    expect(resolveReadyUnits(units, statuses).map((u) => u.id)).toEqual(['0.2']);
  });

  it('unlocks the four project branches after common setup', () => {
    const statuses: StatusMap = { '0.1': 'DONE', '0.2': 'DONE', '0.3': 'DONE' };
    expect(resolveReadyUnits(units, statuses).map((u) => u.id)).toEqual(['1.1', '2.1', '3.1', '4.1']);
  });

  it('continues independent work when Project 1 is externally blocked', () => {
    const statuses: StatusMap = {
      '0.1': 'DONE',
      '0.2': 'DONE',
      '0.3': 'DONE',
      '1.1': 'BLOCKED'
    };
    expect(resolveReadyUnits(units, statuses).map((u) => u.id)).toEqual(['2.1', '3.1', '4.1']);
    expect(canStop(units, statuses)).toBe(false);
  });

  it('does not allow stop while any dependency-ready work exists', () => {
    const statuses: StatusMap = { '0.1': 'DONE' };
    expect(canStop(units, statuses)).toBe(false);
  });
});
