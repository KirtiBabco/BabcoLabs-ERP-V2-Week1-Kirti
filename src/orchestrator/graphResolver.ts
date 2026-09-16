export type UnitStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'BLOCKED';

export interface BuildUnit {
  id: string;
  name: string;
  project: string;
  dependsOn: string[];
}

export type StatusMap = Record<string, UnitStatus>;

export function validateGraph(units: BuildUnit[]): void {
  const ids = new Set(units.map((u) => u.id));
  if (ids.size !== units.length) throw new Error('Duplicate build-unit id');

  for (const unit of units) {
    for (const dependency of unit.dependsOn) {
      if (!ids.has(dependency)) {
        throw new Error(`Missing dependency ${dependency} for ${unit.id}`);
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(units.map((u) => [u.id, u]));

  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Dependency cycle detected at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };

  for (const unit of units) visit(unit.id);
}

export function resolveReadyUnits(units: BuildUnit[], statuses: StatusMap): BuildUnit[] {
  validateGraph(units);

  return units.filter((unit) => {
    const status = statuses[unit.id] ?? 'PENDING';
    if (status !== 'PENDING') return false;
    return unit.dependsOn.every((dependency) => statuses[dependency] === 'DONE');
  });
}

export function canStop(units: BuildUnit[], statuses: StatusMap): boolean {
  const unfinished = units.filter((unit) => (statuses[unit.id] ?? 'PENDING') !== 'DONE');
  if (unfinished.length === 0) return true;

  const ready = resolveReadyUnits(units, statuses);
  if (ready.length > 0) return false;

  return unfinished.every((unit) => statuses[unit.id] === 'BLOCKED');
}
