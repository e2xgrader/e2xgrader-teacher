import { TranslationBundle } from '@jupyterlab/translation';
import {E2xGraderCellRegistry, E2xGraderMetadata} from '@e2xgrader/core';
import { CommandRegistry } from '@lumino/commands';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { showTaskPropertiesDialog } from '../task-properties/taskPropertiesDialog';
import { Dialog } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
const INVALID_CELL_TYPE_ERROR_MESSAGE: string = 'ERROR: invalid cell type';

export class AddPluginTaskCommand implements CommandRegistry.ICommandOptions {
  constructor(
    private _tracker: INotebookTracker,
    private _cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry,
    private _trans: TranslationBundle,
    private _settings: ISettingRegistry.ISettings
  ) {}

  label = (args: any): string => {
    return this._trans.__('Add new Plugin Task');
  };

  caption = (args: any): string => {
    if (this.isInvalidArgs(args)) {
      return INVALID_CELL_TYPE_ERROR_MESSAGE;
    }
    return this._trans.__(
      'Creates a new %1 task',
      this._cellRegistry.getPluginLabel(
        (args as AddPluginTaskCommand.IArgs).cellType
      ) as string
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
    const notebook: Notebook | undefined =
        this._tracker.currentWidget?.content;
    if (!notebook || this.isInvalidArgs(args)) {
      return;
    }

    const addTask: (
      task?: E2xGraderMetadata.IE2xGraderTaskMetadata,
      points?: number
    ) => Promise<void> = async (
      task: E2xGraderMetadata.IE2xGraderTaskMetadata = E2xGraderMetadata.getNewTaskMetadata(),
      points: number = 0
    ) => {
      const plugin: E2xGraderCellRegistry.IE2xGraderCellPlugin | undefined =
        this._cellRegistry.getPlugin(
          (args as AddPluginTaskCommand.IArgs).cellType
        );
      if (!plugin) {
        return;
      }
      const newCellIndex: number = notebook.activeCellIndex + 1;
      notebook.model?.sharedModel.insertCells(
        newCellIndex,
        plugin.getTaskPreset(task, points)
      );
      notebook.activeCellIndex = newCellIndex;
    };

    if (
      this._settings.get('show_add_task_properties_dialog').composite as boolean
    ) {
      return showTaskPropertiesDialog(notebook, this._trans, undefined, true).then(
        (result: Dialog.IResult<{ task: E2xGraderMetadata.IE2xGraderTaskMetadata; points?: number }>) => {
          if (result.button.accept) {
            return addTask(result.value!.task, result.value!.points);
          }
        }
      );
    } else {
      return addTask();
    }
  };

  private isInvalidArgs(args: any): boolean {
    return !this._cellRegistry.getPluginTypes().includes(args?.cellType);
  }
}

export namespace AddPluginTaskCommand {
  export const COMMAND_ID = 'teacher:add-plugin-task';
  export interface IArgs {
    cellType: string;
  }
}
