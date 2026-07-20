import { TranslationBundle } from '@jupyterlab/translation';
import {
  E2xGraderCellRegistry,
  NbgraderCellType,
  ToolbarDropdownComponent
} from '@e2xgrader/core';
import {
  CommandToolbarButtonComponent,
  LabIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { AddNbGraderTaskCommand } from './commands/addNbGraderTaskCommand';
import { AddPluginTaskCommand } from './commands/addPluginTaskCommand';

const TOOLBAR_ADD_TASK_CLASS: string =
  'e2x-notebook-toolbar-widget-add-task-class';

export class AddTaskWidget extends ToolbarDropdownComponent {
  private readonly _pr: ToolbarDropdownComponent.IProps;
  private readonly defaultNbGraderTaskCommands: CommandToolbarButtonComponent.IProps[];

  constructor(
    private _trans: TranslationBundle,
    private _commandRegistry: CommandRegistry,
    private _cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry
  ) {
    super({
      id: AddTaskWidget.WIDGET_ID,
      commands: []
    });
    this._pr = {
      id: AddTaskWidget.WIDGET_ID,
      icon: LabIcon.resolve({ icon: 'ui-components:add' }),
      label: this._trans.__('Task'),
      commands: []
    };
    this.setProps(this._pr);
    this.addClass(TOOLBAR_ADD_TASK_CLASS);

    this.defaultNbGraderTaskCommands = [
      {
        commands: this._commandRegistry,
        id: AddNbGraderTaskCommand.COMMAND_ID,
        args: {
          cellType: 'markdown',
          nbGraderCellType: NbgraderCellType.MANUALLY_GRADED_ANSWER
        },
        label: this._trans.__('Freetext Task')
      },
      {
        commands: this._commandRegistry,
        id: AddNbGraderTaskCommand.COMMAND_ID,
        args: {
          cellType: 'code',
          nbGraderCellType: NbgraderCellType.MANUALLY_GRADED_ANSWER
        },
        label: this._trans.__('Code Task (Manually Graded)')
      },
      {
        commands: this._commandRegistry,
        id: AddNbGraderTaskCommand.COMMAND_ID,
        args: {
          cellType: 'code',
          nbGraderCellType: NbgraderCellType.AUTOGRADED_ANSWER
        },
        label: this._trans.__('Code Task (Automatically Graded)')
      }
    ];

    this._cellRegistry.pluginRegistered.connect(() => this.updateCommands());
    this.updateCommands();
  }

  updateCommands(): void {
    this._pr.commands = [
      ...this.defaultNbGraderTaskCommands,
      ...this._cellRegistry.getPlugins().map(plugin => ({
        commands: this._commandRegistry,
        id: AddPluginTaskCommand.COMMAND_ID,
        args: {
          cellType: plugin.cellType
        },
        label: this._trans.__('%1 Task', plugin.label)
      }))
    ];
    this.update();
  }
}

export namespace AddTaskWidget {
  export const WIDGET_ID: string = 'add-task';
}
