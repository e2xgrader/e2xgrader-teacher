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
    return this._trans.__('Add a autograder test that is linked to this task');
  };

  isEnabled = (args: any): boolean => {
    return getCurrentGradingCell(this._tracker)?.task !== undefined; //only available if the current cell belongs to a task
  };

  isVisible = (args: any): boolean => this.isEnabled(args);

  execute = (args: any): void => {
    const currentGradingCell: GradingCellModel | undefined =
      getCurrentGradingCell(this._tracker);
    const notebook: Notebook | undefined = this._tracker.currentWidget?.content;
    if (!currentGradingCell || !notebook || this.isInvalidArgs(args)) {
      return;
    }
    const newCellIndex: number = notebook.activeCellIndex + 1;
    notebook.model?.sharedModel.insertCell(newCellIndex, {
      ...CellPresets.getAutograderTestPreset(currentGradingCell?.task, (args as AddAutograderTestCommand.IArgs).points),
      source:
        NbGraderAutograding.TEST_START_DELIMITER +
        '\n' +
        this._trans.__(
          '# Test\n' + '\n' + '# Please write your code test here.\n' + '\n'
        ) +
        NbGraderAutograding.TEST_END_DELIMITER
    });
    notebook.activeCellIndex = newCellIndex;
  };

  private isInvalidArgs(args: any): boolean {
    return args?.points !== undefined && !Number.isFinite(args?.points);
  }
}

export namespace AddAutograderTestCommand {
  export const COMMAND_ID: string = 'teacher:add-autograder-test';
  export interface IArgs {
    points?: number
  }
}
