import {CommandRegistry} from '@lumino/commands';
import {TranslationBundle} from "@jupyterlab/translation";
import {JupyterFrontEnd} from "@jupyterlab/application";
import {INotebookTracker} from "@jupyterlab/notebook";
import {findLinkedCells, removeLink} from "./util/GradingCellLinks";
import {GradingCellModel} from "@e2xgrader/core";
import {showTaskLinkWarningDialog} from "./taskLinkWarningDialog";

export const JUPYTERLAB_DELETE_CELL_COMMAND_ID: string = 'notebook:delete-cell';

export class DeleteCellCommand implements CommandRegistry.ICommandOptions {
    constructor(private _app: JupyterFrontEnd, private tracker: INotebookTracker, private trans: TranslationBundle) {
    }

    label= (args: any)=> {
      return this.trans._n(
        'Delete Cell',
        'Delete Cells',
        this.tracker.currentWidget?.content.selectedCells.length ?? 1
      );
    }

    caption = (args: any) => {
      return this.trans._n(
        'Delete this cell 2',
        'Delete these %1 cells',
        this.tracker.currentWidget?.content.selectedCells.length ?? 1
      );
    }

    execute = (args: any) => {
        const executeOriginalCommand = (): Promise<any> => {
            return this._app.commands.execute(JUPYTERLAB_DELETE_CELL_COMMAND_ID, args);
        }

        const linkedCells: Set<GradingCellModel> = new Set<GradingCellModel>();
        const selectedCells: GradingCellModel[]|undefined = this.tracker.currentWidget?.content.selectedCells.map(cell => new GradingCellModel(cell.model.sharedModel));
        if(!selectedCells) throw new Error('Unable to delete cells! No cells selected.');

        selectedCells.forEach(selectedCell => findLinkedCells(this.tracker.currentWidget?.content, selectedCell.id).forEach(linkedCell => linkedCells.add(linkedCell)));
        if(linkedCells.size > 0){
            return showTaskLinkWarningDialog(this.trans).then(result => {
                if(result.button.accept){
                    selectedCells.forEach(selectedCell => linkedCells.forEach(linkedCell => removeLink(linkedCell, selectedCell.id)));
                    return executeOriginalCommand();
                }
            })
        }else {
            return executeOriginalCommand();
        }
    }
}

export namespace DeleteCellCommand{
    export const COMMAND_ID: string = 'teacher:delete-cell';
}