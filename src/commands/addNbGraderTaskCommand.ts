import { CommandRegistry } from '@lumino/commands';
import {
  CellPresets,
  E2xGraderMetadata,
  NbGraderAutograding,
  NbgraderCellType,
  NbgraderCellTypes
} from '@e2xgrader/core';
import { TranslationBundle } from '@jupyterlab/translation';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { AddAutograderTestCommand } from './addAutograderTestCommand';
import { AddTaskDescriptionCommand } from './addTaskDescriptionCommand';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { showTaskPropertiesDialog } from '../taskPropertiesDialog';
import { Dialog } from '@jupyterlab/apputils';

type jupyterCellTypes = 'code' | 'markdown' | 'raw';
const INVALID_CELL_TYPE_ERROR_MESSAGE: string = 'ERROR: invalid cell type';

export class AddNbGraderTaskCommand implements CommandRegistry.ICommandOptions {
  constructor(
    private _app: JupyterFrontEnd,
    private _tracker: INotebookTracker,
    private _trans: TranslationBundle,
    private _settings: ISettingRegistry.ISettings
  ) {}

  label = (args: any): string => {
    return this._trans.__('Add new NbGrader Task');
  };

  caption = (args: any): string => {
    if (this.isInvalidArgs(args)) {
      return INVALID_CELL_TYPE_ERROR_MESSAGE;
    }
    return this._trans.__(
      'Creates a new task with %1 in %2.',
      NbgraderCellTypes.cellTypeLabels[
        (args as AddNbGraderTaskCommand.IArgs).nbGraderCellType
      ],
      (args as AddNbGraderTaskCommand.IArgs).cellType
    );
  };

  isEnabled = (args: any): boolean => {
    return (
      !this.isInvalidArgs(args) &&
      this._tracker.currentWidget?.content !== undefined
    );
  };

  isVisible = (args: any): boolean => this.isEnabled(args);

  execute = async (args: any): Promise<void> => {
    const addTask: (
      taskName?: string,
      points?: number
    ) => Promise<void> = async (
      taskName: string = E2xGraderMetadata.getNewTaskName(),
      points: number = 0
    ) => {
      const notebook: Notebook | undefined =
        this._tracker.currentWidget?.content;
      if (!notebook || this.isInvalidArgs(args)) {
        return;
      }
      const cellType: jupyterCellTypes =
        (args as AddNbGraderTaskCommand.IArgs).cellType ??
        notebook.notebookConfig.defaultCell;
      const nbGraderCellType:
        | NbgraderCellType.MANUALLY_GRADED_ANSWER
        | NbgraderCellType.AUTOGRADED_ANSWER = (
        args as AddNbGraderTaskCommand.IArgs
      ).nbGraderCellType;
      const newCellIndex: number = notebook.activeCellIndex + 1;
      let source: string;
      switch (cellType) {
        case 'markdown':
          source = this._trans.__(
            '## Answer\n' + '\n' + 'Please write your markdown answer here.'
          );
          break;
        case 'code':
          source =
            NbGraderAutograding.SOLUTION_START_SEQUENCE +
            '\n' +
            this._trans.__(
              '# Answer\n' +
                '\n' +
                '# Please write your code answer here.\n' +
                '\n'
            ) +
            NbGraderAutograding.SOLUTION_END_SEQUENCE;
          break;
        case 'raw':
          source = this._trans.__(
            'Answer\n' + '\n' + 'Write your answer here.\n' + '\n'
          );
          break;
      }
      notebook.model?.sharedModel.insertCell(newCellIndex, {
        cell_type: cellType,
        metadata: CellPresets.getCleanMetadata(nbGraderCellType, {
          taskName,
          points
        }),
        source: source
      });
      notebook.activeCellIndex = newCellIndex;
      if (nbGraderCellType === NbgraderCellType.AUTOGRADED_ANSWER) {
        await this._app.commands.execute(AddAutograderTestCommand.COMMAND_ID);
      }
      notebook.activeCellIndex = newCellIndex;
      await this._app.commands.execute(AddTaskDescriptionCommand.COMMAND_ID);
      notebook.activeCellIndex = newCellIndex;
    };

    if (
      this._settings.get('show_add_task_properties_dialog').composite as boolean
    ) {
      return showTaskPropertiesDialog(this._trans, true).then(
        (result: Dialog.IResult<{ taskName: string; points: number }>) => {
          if (result.button.accept) {
            return addTask(result.value!.taskName, result.value!.points);
          }
        }
      );
    } else {
      return addTask();
    }
  };

  private isInvalidArgs(args: any): boolean {
    return (
      ![
        NbgraderCellType.MANUALLY_GRADED_ANSWER,
        NbgraderCellType.AUTOGRADED_ANSWER
      ].includes(args?.nbGraderCellType) ||
      !['code', 'markdown', 'raw'].includes(args?.cellType)
    );
  }
}

export namespace AddNbGraderTaskCommand {
  export const COMMAND_ID = 'teacher:add-nbgrader-task';
  export interface IArgs {
    cellType: jupyterCellTypes;
    nbGraderCellType:
      | NbgraderCellType.MANUALLY_GRADED_ANSWER
      | NbgraderCellType.AUTOGRADED_ANSWER;
  }
}
