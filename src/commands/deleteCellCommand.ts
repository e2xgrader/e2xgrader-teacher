import { CommandRegistry } from '@lumino/commands';
import { TranslationBundle } from '@jupyterlab/translation';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { GradingCellModel } from '@e2xgrader/core';

export const JUPYTERLAB_DELETE_CELL_COMMAND_ID: string = 'notebook:delete-cell';

export class DeleteCellCommand implements CommandRegistry.ICommandOptions {
  constructor(
    private _app: JupyterFrontEnd,
    private _tracker: INotebookTracker,
    private _trans: TranslationBundle
  ) {}

  label = (args: any): string => {
    return this._trans._n(
      'Delete Cell',
      'Delete Cells',
      this._tracker.currentWidget?.content.selectedCells.length ?? 1
    );
  };

  caption = (args: any): string => {
    return this._trans._n(
      'Delete this cell',
      'Delete these %1 cells',
      this._tracker.currentWidget?.content.selectedCells.length ?? 1
    );
  };

  isEnabled = (args: any): boolean => {
    const current = this._tracker.currentWidget;
    if (!current) {
      return false;
    }
    // The 'deletable' metadata is optional, null and undefined values should be made truthy
    const deletable =
      (current.content.activeCell?.model.getMetadata(
        'deletable'
      ) as unknown as boolean) !== false;
    return deletable;
  };

  execute = async (args: any): Promise<any> => {
    const selectedCells: GradingCellModel[] | undefined =
      this._tracker.currentWidget?.content.selectedCells.map(
        cell => new GradingCellModel(cell.model.sharedModel)
      );
    if (!selectedCells) {
      throw new Error('Unable to delete cells! No cells selected.');
    }

    return this._app.commands.execute(
      JUPYTERLAB_DELETE_CELL_COMMAND_ID,
      args
    );

    //todo: implement safeguards for deleting parts of a task
  };
}

export namespace DeleteCellCommand {
  export const COMMAND_ID: string = 'teacher:delete-cell';
}
