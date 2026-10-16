import { CommandRegistry } from '@lumino/commands';
import { TranslationBundle } from '@jupyterlab/translation';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {INotebookTracker, Notebook} from '@jupyterlab/notebook';
import { GradingCellModel } from '@e2xgrader/core';
import {Dialog, showDialog} from "@jupyterlab/apputils";
import {findTaskCells} from "../cell-toolbar/task-links/util";

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
    const notebook: Notebook | undefined = this._tracker.currentWidget?.content;
    const selectedCells: GradingCellModel[] | undefined =
      notebook?.selectedCells.map(
        cell => new GradingCellModel(cell.model.sharedModel)
      );
    if (!notebook || !selectedCells) {
      throw new Error('Unable to delete cells! No cells selected.');
    }

    const performDeletion = async () => {
      return this._app.commands.execute(
          JUPYTERLAB_DELETE_CELL_COMMAND_ID,
          args
      );
    };

    if(selectedCells.some(cell => cell.task !== undefined)) {
      const deleteSelectedButton = Dialog.okButton({
        label: this._trans.__('Delete only the selected cell', 'Delete only the selected cells', selectedCells)
      });

      const deleteWholeTaskButton = Dialog.warnButton({
        label: this._trans.__('Delete all cells')
      });

      return showDialog({
        title: this._trans.__('Deleting Task Cells'),
        body: this._trans.__('The selected cell is part of a task, that consists of multiple cells. Do you want to extend the deletion to the whole task?', 'At least one of the selected cells is part of a task, that consists of multiple cells. Do you want delete all cells of the task(s)?', selectedCells.length),
        buttons: [
            Dialog.cancelButton({
              label: this._trans.__('Cancel')
            }),
            deleteSelectedButton,
            deleteWholeTaskButton
        ],
        defaultButton: 0
      }).then(async result => {
        if(result.button === deleteWholeTaskButton) {
          const selectedTaskIds: string[] = selectedCells
              .map(cell => cell.task?.id)                                          // get task metadata
              .filter(taskId => taskId !== undefined)                              // remove cells that don't belong to a task
              .filter((taskId, index, array) => array.indexOf(taskId) === index);  // remove redundant entries

          selectedTaskIds.forEach(taskId => {
            findTaskCells(notebook, taskId).forEach(cell => notebook.select(cell)); // find all cells that belong to this task and select them
          })

          return performDeletion();

        }else if(result.button === deleteSelectedButton){
          return performDeletion();
        }
      });
    }else {
      return performDeletion();
    }
  };
}

export namespace DeleteCellCommand {
  export const COMMAND_ID: string = 'teacher:delete-cell';
}
