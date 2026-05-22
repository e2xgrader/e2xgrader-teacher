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
import {DeleteCellCommand} from "./deleteCellCommand";

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

const deleteCellCommandPlugin: JupyterFrontEndPlugin<void> =
  {
    id: '@e2xgrader/teacher:delete-cell',
    description: 'A JupyterLab extension for a checked delete-cell command in e2xgrader teacher mode',
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
        'JupyterLab extension @e2xgrader/teacher:delete-cell is activated!'
      );
      const trans = (translator ?? nullTranslator).load('e2xgrader_teacher');

      console.log(_app.commands);
      _app.commands.addCommand(DeleteCellCommand.COMMAND_ID, new DeleteCellCommand(_app, tracker, trans));
      commandPalette.addItem({ command: DeleteCellCommand.COMMAND_ID, category: 'e2xgrader'});
    }
  };

export default [
    cellFactoryPlugin,
    toolbarWidgetFactoryPlugin,
    deleteCellCommandPlugin
] as JupyterFrontEndPlugin<any>[];
