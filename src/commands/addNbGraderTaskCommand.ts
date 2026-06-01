import {CommandRegistry} from "@lumino/commands";
import {
    E2X_METADATA_KEY,
    E2xGraderMetadata,
    NbgraderCellType,
    NbgraderCellTypes,
    NbgraderMetadata
} from "@e2xgrader/core";
import {TranslationBundle} from "@jupyterlab/translation";
import {INotebookTracker, Notebook} from "@jupyterlab/notebook";
import {JupyterFrontEnd} from "@jupyterlab/application";
import {AddAutograderTestCommand} from "./addAutograderTestCommand";
import {AddTaskDescriptionCommand} from "./addTaskDescriptionCommand";

const INVALID_CELL_TYPE_ERROR_MESSAGE: string = 'ERROR: invalid cell type';

export class AddNbGraderTaskCommand implements CommandRegistry.ICommandOptions {
    constructor(private _app: JupyterFrontEnd, private _tracker: INotebookTracker, private _trans: TranslationBundle) {
    }

    label = (args: any): string => {
        return this._trans.__(`Add new NbGrader Task`)
    };

    caption = (args: any): string => {
        if(this.isInvalidArgs(args)) return INVALID_CELL_TYPE_ERROR_MESSAGE;
        return this._trans.__(`Creates a new task with ${NbgraderCellTypes.cellTypeLabels[(args as AddNbGraderTaskCommand.Args).cellType]}`)
    };

    isEnabled = (args: any): boolean => {
        return !this.isInvalidArgs(args) && this._tracker.currentWidget?.content !== undefined;
    };

    isVisible = (args: any): boolean => this.isEnabled(args);

    execute = (args: any): void => {
        const notebook: Notebook | undefined = this._tracker.currentWidget?.content;
        if(!notebook || this.isInvalidArgs(args)) return;
        const cellType: NbgraderCellType.MANUALLY_GRADED_ANSWER | NbgraderCellType.AUTOGRADED_ANSWER = (args as AddNbGraderTaskCommand.Args).cellType;
        const newCellIndex: number = notebook.activeCellIndex;
        notebook.model?.sharedModel.insertCell(newCellIndex, {
            cell_type: notebook.notebookConfig.defaultCell,
            metadata: {
                [E2X_METADATA_KEY]: E2xGraderMetadata.E2X_METADATA_DEFAULTS,
                [NbgraderMetadata.NBGRADER_METADATA_KEY]: {...NbgraderMetadata.newNbGraderMetadata(), ...(NbgraderCellTypes.cellTypeConfigurations[cellType])}
            }
        });
        notebook.activeCellIndex = newCellIndex;
        if(cellType === NbgraderCellType.AUTOGRADED_ANSWER) {
            this._app.commands.execute(AddAutograderTestCommand.COMMAND_ID);
        }
        notebook.activeCellIndex = newCellIndex;
        this._app.commands.execute(AddTaskDescriptionCommand.COMMAND_ID);
        notebook.activeCellIndex = newCellIndex;
    };

    private isInvalidArgs(args: any): boolean{
        return ![NbgraderCellType.MANUALLY_GRADED_ANSWER, NbgraderCellType.AUTOGRADED_ANSWER].includes(args?.cellType);
    }
}

export namespace AddNbGraderTaskCommand {
    export const COMMAND_ID = 'teacher:add-nbgrader-task';
    export interface Args {
        cellType: NbgraderCellType.MANUALLY_GRADED_ANSWER | NbgraderCellType.AUTOGRADED_ANSWER
    }
}