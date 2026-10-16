import {
  E2xGraderCellToolbar,
  E2xGraderCellRegistry,
  E2xGraderMetadata
} from '@e2xgrader/core';
import { Toolbar, lockIcon, addIcon, editIcon, linkIcon } from '@jupyterlab/ui-components';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import CellTypeSelector from './CellTypeSelector';
import React from 'react';
import PointsInput from './PointsInput';
import { Notebook } from '@jupyterlab/notebook';
import { TaskLinkModal } from './task-links/TaskLinkModal';
import { TranslationBundle } from '@jupyterlab/translation';
import { Signal } from '@lumino/signaling';
import {findTaskGradingCells, findAllTasks} from "./task-links/util";
import {Message} from "@lumino/messaging";
import {showTaskPropertiesDialog} from "../taskPropertiesDialog";

export const SOLUTION_CELL_CLASS = 'e2xgrader-SolutionCell';
export const READ_ONLY_CELL_CLASS = 'e2xgrader-ReadOnlyCell';

export const SAVE_TASK_BUTTON_CLASS = 'e2xgrader-save-task-button';
export const LINK_TASK_BUTTON_CLASS = 'e2xgrader-link-task-button';
export const DISMISS_LINK_TASK_BUTTON_CLASS =
  'e2xgrader-dismiss-link-task-button';

const AVAILABLE_TASK_COLOR_COUNT: number = 8;

export class TeacherCellToolbar extends E2xGraderCellToolbar.CellToolbar {
  constructor(
    options: Toolbar.IOptions,
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    private _trans: TranslationBundle,
    private cellMetaDataChange: Signal<any, string>
  ) {
    super(options, registry);
    this.addClass('e2xgrader-TeacherCellToolbar');
  }

  update() {
    super.update();
    if (this.gradingCellModel?.isSolution || this.gradingCellModel?.isTask) {
      this.addClass(SOLUTION_CELL_CLASS);
    } else {
      this.removeClass(SOLUTION_CELL_CLASS);
    }
    if (this.gradingCellModel?.isDescription) {
      this.addClass(READ_ONLY_CELL_CLASS);
    } else {
      this.removeClass(READ_ONLY_CELL_CLASS);
    }
  }

  get trans(): TranslationBundle {
    return this._trans;
  }

  protected announceMetaDataUpdate = (): void => {
    if (this.gradingCellModel) {
      this.cellMetaDataChange.emit(this.gradingCellModel.id ?? '');
    }
  };

  protected onAfterAttach(_msg: Message) {
    super.onAfterAttach(_msg);
    this.gradingCellModel?.metadataChanged.connect(this.announceMetaDataUpdate);
    this.announceMetaDataUpdate();
  }

  protected onBeforeDetach(msg: Message) {
    super.onBeforeDetach(msg);
    this.gradingCellModel?.metadataChanged.disconnect(
      this.announceMetaDataUpdate
    );
  }
}

export namespace TeacherCellToolbar {
  export class TeacherCellToolbarElement
    extends E2xGraderCellToolbar.ToolbarElement
  {
    constructor(
      teacherToolbar: TeacherCellToolbar,
      private _trans: TranslationBundle
    ) {
      super(teacherToolbar);
    }

    get trans(): TranslationBundle {
      return this._trans;
    }

    protected getNotebook(): Notebook {
      return this.cell?.parent as Notebook;
    }
  }

  export class TypeSelector extends E2xGraderCellToolbar.ToolbarElement {
    constructor(
      toolbar: TeacherCellToolbar
    ) {
      super(toolbar);
    }

    setCellType(newType: string): void {
      if (this.gradingCellModel) {
        this.gradingCellModel.switchToCellType(this.cellRegistry, newType);
      }
      this.update();
      this.parent?.update();
    }

    renderElement(): React.JSX.Element {
      return (
        <div className="e2xgrader-CellType e2x-controls">
          <CellTypeSelector
            initialType={this.gradingCellModel?.gradingCellType ?? ''}
            onChange={e => this.setCellType(e)}
            cellRegistry={this.cellRegistry}
          />
        </div>
      );
    }
  }

  export class CellPointsInput extends E2xGraderCellToolbar.ToolbarElement {
    private errorMessage: string | undefined;

    constructor(
      toolbar: E2xGraderCellToolbar.CellToolbar,
      private _trans: TranslationBundle
    ) {
      super(toolbar);
    }

    setPoints(newPoints: number): void {
      if (!this.gradingCellModel) {
        return;
      }
      this.gradingCellModel.points = newPoints;
    }

    handleErrors(errors: string[]): void {
      if (errors.includes('finiteNumber')) {
        this.errorMessage = this._trans.__('Points must be a finite number');
      } else if (errors.includes('min')) {
        this.errorMessage = this._trans.__('Points must be at least 0');
      } else {
        this.errorMessage = undefined;
      }
      this.update();
    }

    renderElement(): React.JSX.Element {
      const pointsLabel: string = this._trans.__('Points:');
      return this.gradingCellModel?.hasPoints ? (
        <div
          className="e2xgrader-Points e2x-controls"
          title={this.errorMessage}
        >
          <label>{pointsLabel} </label>
          <PointsInput
            initialPoints={this.gradingCellModel?.nbgraderMetadata?.points ?? 0}
            onChange={e => this.setPoints(e)}
            onError={e => this.handleErrors(e)}
          />
        </div>
      ) : (
        <></>
      );
    }
  }

  export class CellTaskLink extends TeacherCellToolbarElement {
    private linkId;
    static currentLinkId = 0;
    constructor(
      teacherToolbar: TeacherCellToolbar,
      trans: TranslationBundle,
      cellMetaDataChange: Signal<any, string>
    ) {
      super(teacherToolbar, trans);
      this.linkId = CellTaskLink.currentLinkId++;
      cellMetaDataChange.connect((sender: any, cellUuid: string) => {
        if (!this.gradingCellModel || this.gradingCellModel.id !== cellUuid) {
          return;
        }
        console.log(this.linkId, 'metadataChange received', cellUuid);
        this.update();
        this.parent?.update();
      });
    }

    setLinkedTask(newTask: E2xGraderMetadata.IE2xGraderTaskMetadata | undefined): void {
      if (!this.gradingCellModel) {
        return;
      }
      this.gradingCellModel.task = newTask;
      this.update();
    }

    private showSelectionDialog(): void {
      const notebook = this.getNotebook();
      const gradingCell = this.gradingCellModel;

      if(!notebook || !gradingCell) return;

      showDialog({
        title: this.trans.__('Task Link'),
        body: new TaskLinkModal(
          notebook,
          gradingCell
        ),
        buttons: [
          Dialog.cancelButton({
            label: this.trans.__('Dismiss'),
            className: DISMISS_LINK_TASK_BUTTON_CLASS
          }),
          Dialog.okButton({
            label: this.trans.__('Link Task'),
            className: LINK_TASK_BUTTON_CLASS
          })
        ]
      }).then(result => {
        if (result.button.accept) {
          this.setLinkedTask(result.value ?? undefined);
        }
      });
    }

    private updateTask(updatedTask: E2xGraderMetadata.IE2xGraderTaskMetadata): void {
      findTaskGradingCells(this.getNotebook(), updatedTask.id).forEach(cell => cell.task = updatedTask);
      this.update();
    }

    private showCreateDialog(): void {
      if(!this.gradingCellModel || this.gradingCellModel.task) return; // do not create a new task if either the gradingCellModel is not available or the cell already belongs to a task

      showTaskPropertiesDialog(this.getNotebook(), this.trans).then(result => {
        if (result?.button.accept) {
          this.gradingCellModel!.task = result.value!.task;
        }
      });
    }

    private showEditDialog(): void {
      const gradingCell = this.gradingCellModel;

      if(!gradingCell || !gradingCell.task) return;

      showTaskPropertiesDialog(this.getNotebook(), this.trans, gradingCell.task).then(result => {
        if (result?.button.accept) {
          this.updateTask(result.value!.task);
        }
      });
    }

    renderElement(): React.JSX.Element {
      const linkTaskPlaceholder: string = this.trans.__('[no task]');
      const editTaskButtonTitle: string = this.trans.__('edit task properties');
      const createTaskButtonTitle: string = this.trans.__('create new task');
      const linkTaskButtonTitle: string = this.trans.__('link existing task');
      const taskMetadata: E2xGraderMetadata.IE2xGraderTaskMetadata | undefined = this.gradingCellModel?.task;

      const taskColorClass = taskMetadata?.id ? ' colored task-color-' + ((findAllTasks(this.getNotebook()).findIndex(task => task.id === taskMetadata.id) % AVAILABLE_TASK_COLOR_COUNT) + 1) : '';

      return (
        <div className={'e2xgrader-TaskLink' + taskColorClass }>
          { taskMetadata?.id ?
              <React.Fragment>
                <div className={'e2xgrader-task-name'} >{taskMetadata?.name}</div>
                <div className={'e2xgrader-task-link-button'} onClick={() => this.showEditDialog()} title={editTaskButtonTitle}>
                  <editIcon.react className="e2xgrader-EditIcon" />
                </div>
              </React.Fragment> :
              <React.Fragment>
                <div className={'e2xgrader-task-name-placeholder'}>{linkTaskPlaceholder}</div>
                <div className={'e2xgrader-task-link-button'} onClick={() => this.showCreateDialog()} title={createTaskButtonTitle}>
                  <addIcon.react className="e2xgrader-AddIcon" />
                </div>
              </React.Fragment> }
          <div className={'e2xgrader-task-link-button'} onClick={() => this.showSelectionDialog()} title={linkTaskButtonTitle}>
            <linkIcon.react className="e2xgrader-LinkIcon" />
          </div>
        </div>
      );
    }
  }

  export class CellLabel extends E2xGraderCellToolbar.ToolbarElement {
    renderElement(): React.JSX.Element {
      const isReadOnly =
        this.gradingCellModel?.isDescription || this.gradingCellModel?.isTask;

      return (
        <div className="e2xgrader-CellLabel">
          {isReadOnly ? <lockIcon.react className="e2xgrader-LockIcon" /> : ''}
        </div>
      );
    }
  }

  export function createTeacherCellToolbar(
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    trans: TranslationBundle,
    cellMetaDataChange: Signal<any, string>
  ): TeacherCellToolbar {
    const toolbar = new TeacherCellToolbar(
      {},
      registry,
      trans,
      cellMetaDataChange
    );
    toolbar.addItem('type', new TypeSelector(toolbar));
    toolbar.addItem('label', new CellLabel(toolbar));
    toolbar.addItem(
      'task-link',
      new CellTaskLink(toolbar, trans, cellMetaDataChange)
    );
    toolbar.addItem('points', new CellPointsInput(toolbar, trans));
    return toolbar;
  }
}
