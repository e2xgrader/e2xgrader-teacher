import { INotebookTracker } from '@jupyterlab/notebook';
import { GradingCellModel } from '@e2xgrader/core';

export function getCurrentGradingCell(
  tracker: INotebookTracker
): GradingCellModel | undefined {
  const selectedCells = tracker.currentWidget?.content.selectedCells;
  if (!selectedCells || selectedCells.length > 1) {
    return undefined;
  }
  return new GradingCellModel(selectedCells[0].model.sharedModel);
}
