import {
  E2xGraderCellToolbar,
  E2xGraderCellRegistry,
  GradingCellModel,
  NbgraderCellType,
  NbgraderCellTypes
} from '@e2xgrader/core';
import { Toolbar, lockIcon } from '@jupyterlab/ui-components';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import CellTypeSelector from './CellTypeSelector';
import React from 'react';
import TaskNameInput, {
  TASK_NAME_MIN_LENGTH,
  TASK_NAME_MAX_LENGTH
} from './TaskNameInput';
import PointsInput from './PointsInput';
import { Notebook } from '@jupyterlab/notebook';
import { TaskLinkModal } from './task-links/TaskLinkModal';
import { TranslationBundle } from '@jupyterlab/translation';
import { linkIcon } from '@jupyterlab/ui-components';
import { showTaskLinkWarningDialog } from './task-links/taskLinkWarningDialog';
import {
  findLinkedCells,
  isLinkedCell,
  removeLink
} from '../util/GradingCellLinks';
import { Signal } from '@lumino/signaling';
import { Message } from '@lumino/messaging';

export const SOLUTION_CELL_CLASS = 'e2xgrader-SolutionCell';
export const READ_ONLY_CELL_CLASS = 'e2xgrader-ReadOnlyCell';

export const LINK_TASK_BUTTON_CLASS = 'e2xgrader-link-task-button';
export const DISMISS_LINK_TASK_BUTTON_CLASS =
  'e2xgrader-dismiss-link-task-button';

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
      this.cellMetaDataChange.emit(this.gradingCellModel.id);
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

    protected getSolutionCells(): GradingCellModel[] {
      return (
        (this.cell?.parent as Notebook)?.widgets
          .map(cell => new GradingCellModel(cell.model.sharedModel))
          .filter(cell => cell.isSolution) ?? []
      );
    }
  }

  export class TypeSelector extends E2xGraderCellToolbar.ToolbarElement {
    constructor(
      toolbar: TeacherCellToolbar,
      private trans: TranslationBundle
    ) {
      super(toolbar);
    }

    setCellType(newType: string): void {
      const proceedSettingType = (): void => {
        if (this.gradingCellModel) {
          this.gradingCellModel.switchToCellType(this.cellRegistry, newType);
        }
        this.update();
        this.parent?.update();
      };

      if (
        this.gradingCellModel &&
        this.gradingCellModel?.isSolution && // if the cell was a solution cell
        !(
          NbgraderCellTypes.cellTypeConfigurations[newType as NbgraderCellType]
            ?.solution ?? false
        )
      ) {
        // and the new cell type does not mark a solution cell
        const linkedCells: GradingCellModel[] = findLinkedCells(
          this.cell?.parent as Notebook,
          this.gradingCellModel!.id
        );
        if (linkedCells.length > 0) {
          showTaskLinkWarningDialog(this.trans).then(result => {
            if (result.button.accept) {
              linkedCells.forEach(cell =>
                removeLink(cell, this.gradingCellModel!.id)
              );
              proceedSettingType();
            }
          });
        } else {
          proceedSettingType();
        }
      } else {
        proceedSettingType();
      }
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

  export class CellTaskNameInput extends TeacherCellToolbarElement {
    private otherTaskNames: string[] = [];
    private errorMessage: string | undefined;

    constructor(
      teacherToolbar: TeacherCellToolbar,
      trans: TranslationBundle,
      cellMetaDataChange: Signal<any, string>
    ) {
      super(teacherToolbar, trans);
      cellMetaDataChange.connect((sender: any, cellId: string) => {
        if (!this.gradingCellModel?.isLinkTarget) {
          return;
        } //do nothing if this cell should not have a name
        this.otherTaskNames = this.getSolutionCells()
          .filter(gradingCell => gradingCell.id !== this.gradingCellModel?.id) //remove the current cell
          .map(gradingCell => gradingCell.taskName)
          .filter(name => name) as string[]; //remove all undefined names
        this.update();
        this.parent?.update();
      });
      console.log('taskNameInput initialized');
    }

    setTaskName(newName: string): void {
      if (!this.gradingCellModel) {
        return;
      }
      this.gradingCellModel.taskName = newName;
    }

    handleErrors(errors: string[]): void {
      if (errors.includes('duplicate')) {
        this.errorMessage = this.trans.__('This task name is not unique!');
      } else if (errors.includes('minLength')) {
        this.errorMessage = this.trans._n(
          `The task name must be at least ${TASK_NAME_MIN_LENGTH} character long!`,
          `The task name must be at least ${TASK_NAME_MIN_LENGTH} characters long!`,
          TASK_NAME_MIN_LENGTH
        );
      } else if (errors.includes('maxLength')) {
        this.errorMessage = this.trans.__(
          `The task name must not be more than ${TASK_NAME_MAX_LENGTH} characters long!`
        );
      } else {
        this.errorMessage = undefined;
      }
      this.update();
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel?.isLinkTarget ? (
        <div
          className="e2xgrader-TaskName e2x-controls"
          title={this.errorMessage}
        >
          <TaskNameInput
            initialName={this.gradingCellModel?.taskName ?? ''}
            otherTaskNames={this.otherTaskNames}
            onChange={e => this.setTaskName(e)}
            onError={e => this.handleErrors(e)}
          />
        </div>
      ) : (
        <></>
      );
    }
  }

  export class CellPointsInput extends E2xGraderCellToolbar.ToolbarElement {
    private errorMessage: string | undefined;

    constructor(
      toolbar: E2xGraderCellToolbar.CellToolbar,
      private trans: TranslationBundle
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
        this.errorMessage = this.trans.__('Points must be a finite number');
      } else if (errors.includes('min')) {
        this.errorMessage = this.trans.__('Points must be at least 0');
      } else {
        this.errorMessage = undefined;
      }
      this.update();
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel?.hasPoints ? (
        <div
          className="e2xgrader-Points e2x-controls"
          title={this.errorMessage}
        >
          <label>Points: </label>
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
    constructor(
      teacherToolbar: TeacherCellToolbar,
      trans: TranslationBundle,
      cellMetaDataChange: Signal<any, string>
    ) {
      super(teacherToolbar, trans);
      cellMetaDataChange.connect((sender: any, cellId: string) => {
        if (
          !this.gradingCellModel ||
          (!isLinkedCell(this.gradingCellModel, cellId) &&
            cellId !== this.gradingCellModel.id)
        ) {
          return;
        }
        this.update();
        this.parent?.update();
      });
    }

    setLinkedTaskId(newId: string | undefined): void {
      if (!this.gradingCellModel) {
        return;
      }
      this.gradingCellModel.for = newId;
      this.update();
    }

    private findLinkedTaskCell(
      solutionCells: GradingCellModel[]
    ): GradingCellModel | undefined {
      return solutionCells.find(cell => cell.id === this.gradingCellModel?.for);
    }

    private showSelectionDialog(): void {
      showDialog({
        title: this.trans.__('Task Link'),
        body: new TaskLinkModal(
          this.gradingCellModel?.for,
          this.getSolutionCells()
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
          this.setLinkedTaskId(
            !result.value || result.value === '-'
              ? undefined
              : (result.value as string)
          );
        }
      });
    }

    renderElement(): React.JSX.Element {
      const solutionCells: GradingCellModel[] = this.getSolutionCells();
      const linkedTaskCell: GradingCellModel | undefined =
        this.findLinkedTaskCell(solutionCells);

      return this.gradingCellModel?.isLinkable ? (
        this.gradingCellModel?.for ? (
          <div className="e2xgrader-TaskLink linked">
            <a onClick={() => this.showSelectionDialog()}>
              <linkIcon.react className="e2xgrader-LinkIcon" />{' '}
              {linkedTaskCell?.taskName}
            </a>
          </div>
        ) : (
          <div className="e2xgrader-TaskLink">
            <a onClick={() => this.showSelectionDialog()}>+ link to task</a>
          </div>
        )
      ) : (
        <></>
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
    toolbar.addItem('type', new TypeSelector(toolbar, trans));
    toolbar.addItem('label', new CellLabel(toolbar));
    toolbar.addItem(
      'task-name',
      new CellTaskNameInput(toolbar, trans, cellMetaDataChange)
    );
    toolbar.addItem(
      'task-link',
      new CellTaskLink(toolbar, trans, cellMetaDataChange)
    );
    toolbar.addItem('points', new CellPointsInput(toolbar, trans));
    return toolbar;
  }
}
