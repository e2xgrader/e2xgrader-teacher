import { CommandRegistry } from '@lumino/commands';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { TranslationBundle } from '@jupyterlab/translation';
import { GradingCellModel, CellPresets } from '@e2xgrader/core';
import { getCurrentGradingCell } from '../util/AuthoringCommands';

export class AddTaskDescriptionCommand
  implements CommandRegistry.ICommandOptions
{
  constructor(
    private _tracker: INotebookTracker,
    private _trans: TranslationBundle
  ) {}

  label = (args: any): string => {
    return this._trans.__('Add Task Description Cell');
  };

  caption = (args: any): string => {
    return this._trans.__('Add a task description that is linked to this cell');
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
    const newCellIndex: number = notebook.activeCellIndex;
    notebook.model?.sharedModel.insertCell(newCellIndex, {
      ...CellPresets.getTaskDescriptionPreset(currentGradingCell?.id),
      source: this._trans.__(
        '## Question\n' + '\n' + 'Please write your question here.'
      )
    });
    notebook.activeCellIndex = newCellIndex;
  };
}

export namespace AddTaskDescriptionCommand {
  export const COMMAND_ID: string = 'teacher:add-task-description';
}
