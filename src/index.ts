import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorServices } from '@jupyterlab/codeeditor';
import {INotebookTracker, NotebookPanel} from '@jupyterlab/notebook';
import { E2XContentFactoryTeacher } from './content-factory';
import { E2xGraderCellRegistry } from '@e2xgrader/core';
import {
    ICommandPalette,
  IToolbarWidgetRegistry
} from '@jupyterlab/apputils';
import {ITranslator, nullTranslator} from '@jupyterlab/translation';
import {DeleteCellCommand/*, JUPYTERLAB_DELETE_CELL_COMMAND_ID*/} from "./commands/deleteCellCommand";
import {AddTaskDescriptionCommand} from "./commands/addTaskDescriptionCommand";
import {AddAutograderTestCommand} from "./commands/addAutograderTestCommand";
//import {CommandPalette} from '@lumino/widgets';
//import {EditableCommandPalette} from "@e2xgrader/core";

/**
 * Initialization data for the @e2xgrader/teacher extension.
 */
const cellFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> =
  {
    id: '@e2xgrader/teacher:plugin',
    description: 'A JupyterLab extension for e2xgrader teacher mode',
    autoStart: true,
    requires: [IEditorServices, E2xGraderCellRegistry.IE2xGraderCellRegistry],
    optional: [ITranslator],
    provides: NotebookPanel.IContentFactory,
    activate: (
      _app: JupyterFrontEnd,
      editorServices: IEditorServices,
      cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry,
      translator?: ITranslator
    ) => {
      console.log(
        'JupyterLab extension @e2xgrader/teacher:plugin is activated!'
      );

      const trans = (translator ?? nullTranslator).load('e2xgrader_teacher');

      const editorFactory = editorServices.factoryService.newInlineEditor;
      const contentFactory = new E2XContentFactoryTeacher(
        {
          editorFactory
        },
        undefined,
        cellRegistry,
        trans
      );
      return contentFactory;
    }
  };

const toolbarWidgetFactoryPlugin: JupyterFrontEndPlugin<void> =
  {
    id: '@e2xgrader/teacher:toolbar-widgets',
    description: 'A JupyterLab extension for toolbar widgets in e2xgrader teacher mode',
    autoStart: true,
    requires: [IToolbarWidgetRegistry, E2xGraderCellRegistry.IE2xGraderCellRegistry],
    optional: [ITranslator],
    activate: (
      _app: JupyterFrontEnd,
      toolbarWidgetRegistry: IToolbarWidgetRegistry,
      cellRegistry: E2xGraderCellRegistry.IE2xGraderCellRegistry,
      translator?: ITranslator
    ) => {
      console.log(
        'JupyterLab extension @e2xgrader/teacher:toolbar-widgets is activated!'
      );


    }
  };

const authoringCommandsPlugin: JupyterFrontEndPlugin<void> =
  {
    id: '@e2xgrader/teacher:authoring-commands',
    description: 'A JupyterLab extension for authoring commands in e2xgrader teacher mode',
    autoStart: true,
    requires: [INotebookTracker, ICommandPalette],
    optional: [ITranslator],
    activate: (
      _app: JupyterFrontEnd,
      tracker: INotebookTracker,
      commandPalette: ICommandPalette,
      translator?: ITranslator
    ) => {
      console.log(
        'JupyterLab extension @e2xgrader/teacher:authoring-commands is activated!'
      );
      const trans = (translator ?? nullTranslator).load('e2xgrader_teacher');

      console.log(_app.commands);
      _app.commands.addCommand(DeleteCellCommand.COMMAND_ID, new DeleteCellCommand(_app, tracker, trans));
      commandPalette.addItem({ command: DeleteCellCommand.COMMAND_ID, category: 'e2xgrader'});
      _app.commands.addKeyBinding({
        command: DeleteCellCommand.COMMAND_ID,
        keys: ['D', 'D'],
        selector: '.jp-Notebook'
      });

      _app.commands.addCommand(AddTaskDescriptionCommand.COMMAND_ID, new AddTaskDescriptionCommand(tracker, trans));
      commandPalette.addItem({ command: AddTaskDescriptionCommand.COMMAND_ID, category: 'e2xgrader'});

      _app.commands.addCommand(AddAutograderTestCommand.COMMAND_ID, new AddAutograderTestCommand(tracker, trans));
      commandPalette.addItem({ command: AddAutograderTestCommand.COMMAND_ID, category: 'e2xgrader'});

      //const cPalette: CommandPalette = (commandPalette as EditableCommandPalette).palette;
      //const originalDeleteCommandItem = cPalette.items.find(commandItem => commandItem.command === JUPYTERLAB_DELETE_CELL_COMMAND_ID);
      //if(originalDeleteCommandItem) cPalette.removeItem(originalDeleteCommandItem);
    }
  };

export default [
    cellFactoryPlugin,
    toolbarWidgetFactoryPlugin,
    authoringCommandsPlugin
] as JupyterFrontEndPlugin<any>[];
