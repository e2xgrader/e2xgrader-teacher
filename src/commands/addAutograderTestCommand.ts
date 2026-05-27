import {CommandRegistry} from "@lumino/commands";
import {INotebookTracker, Notebook} from "@jupyterlab/notebook";
import {TranslationBundle} from "@jupyterlab/translation";
import {
    GradingCellModel,
    E2xGraderMetadata,
    E2X_METADATA_KEY,
    NbgraderMetadata,
    NbgraderCellTypes, NbgraderCellType
} from "@e2xgrader/core";
import {getCurrentGradingCell} from "../util/AuthoringCommands";

export const AUTOGRADER_TEST_DEFAULT_CELL_TYPE = 'code';

export class AddAutograderTestCommand implements CommandRegistry.ICommandOptions {
    constructor(private _tracker: INotebookTracker, private _trans: TranslationBundle) {
    }

    label = (args: any): string => {
      return this._trans.__('Add Autograder Test Cell');
    }

    caption = (args: any): string => {
        return this._trans.__('Add a autograder test that is linked to this cell');
    }

    isEnabled = (args: any): boolean => {
        return getCurrentGradingCell(this._tracker)?.isSolution ?? false;
    }

    isVisible = (args: any): boolean => this.isEnabled(args);

    execute = (args: any): void => {
        const currentGradingCell: GradingCellModel | undefined = getCurrentGradingCell(this._tracker);
        const notebook: Notebook | undefined = this._tracker.currentWidget?.content;
        if(!currentGradingCell || !notebook) return;
        const newCellIndex: number = notebook.activeCellIndex + 1;
        notebook.model?.sharedModel.insertCell(newCellIndex, {
            cell_type: AUTOGRADER_TEST_DEFAULT_CELL_TYPE,
            metadata: {
                [E2X_METADATA_KEY]: {...E2xGraderMetadata.E2X_METADATA_DEFAULTS, ...{for: currentGradingCell.id}},
                [NbgraderMetadata.NBGRADER_METADATA_KEY]: {...NbgraderMetadata.newNbGraderMetadata(), ...(NbgraderCellTypes.cellTypeConfigurations[NbgraderCellType.AUTOGRADER_TEST])}
            }
        });
        notebook.activeCellIndex = newCellIndex;
    }
}

export namespace AddAutograderTestCommand{
    export const COMMAND_ID: string = 'teacher:add-autograder-test';
}