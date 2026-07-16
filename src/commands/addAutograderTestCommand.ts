import { CommandRegistry } from '@lumino/commands';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { TranslationBundle } from '@jupyterlab/translation';
import {
  GradingCellModel,
  CellPresets,
  NbGraderAutograding
} from '@e2xgrader/core';
import { getCurrentGradingCell } from '../util/AuthoringCommands';

export class AddAutograderTestCommand
  implements CommandRegistry.ICommandOptions
{
  constructor(
    private _tracker: INotebookTracker,
    private _trans: TranslationBundle
  ) {}

  label = (args: any): string => {
    return this._trans.__('Add Autograder Test Cell');
  };

  caption = (args: any): string => {
    return this._trans.__('Add a autograder test that is linked to this cell');
  };

  isEnabled = (args: any): boolean => {
    return getCurrentGradingCell(this._tracker)?.isSolution ?? false;
  };

  isVisible = (args: any): boolean => this.isEnabled(args);

  execute = (args: any): void => {
    const currentGradingCell: GradingCellModel | undefined =
      getCurrentGradingCell(this._tracker);
    const notebook: Notebook | undefined = this._tracker.currentWidget?.content;
    if (!currentGradingCell || !notebook) {
      return;
    }
    const newCellIndex: number = notebook.activeCellIndex + 1;
    notebook.model?.sharedModel.insertCell(newCellIndex, {
      ...CellPresets.getAutograderTestPreset(currentGradingCell?.id),
      source:
        NbGraderAutograding.TEST_START_SEQUENCE +
        '\n' +
        this._trans.__(
          '# Test\n' + '\n' + '# Please write your code test here.\n' + '\n'
        ) +
        NbGraderAutograding.TEST_END_SEQUENCE
    });
    notebook.activeCellIndex = newCellIndex;
  };
}

export namespace AddAutograderTestCommand {
  export const COMMAND_ID: string = 'teacher:add-autograder-test';
}
