import { Notebook } from '@jupyterlab/notebook';
import { GradingCellModel } from '@e2xgrader/core';

export function findLinkedCells(
  notebook?: Notebook,
  targetId?: string
): GradingCellModel[] {
  if (!targetId) {
    return [];
  }
  return (
    notebook?.widgets
      .map(cell => new GradingCellModel(cell.model.sharedModel))
      .filter(cell => isLinkedCell(cell, targetId)) ?? []
  );
}

export function removeLink(cell: GradingCellModel, targetId: string) {
  function throwNotLinkedError(): void {
    throw new Error(
      'Unable to remove link! Cell is not linked to specified target'
    );
  }

  if (Array.isArray(cell.for)) {
    if (!cell.for.includes(targetId)) {
      throwNotLinkedError();
    }
    cell.for = cell.for.filter(id => id !== targetId);
    if (cell.for.length === 0) {
      cell.for = undefined;
    }
  } else {
    if (cell.for !== targetId) {
      throwNotLinkedError();
    }
    cell.for = undefined;
  }
}

export function isLinkedCell(
  originCell: GradingCellModel,
  targetCellId: string
): boolean {
  return Array.isArray(originCell.for)
    ? originCell.for.includes(targetCellId)
    : originCell.for === targetCellId;
}
