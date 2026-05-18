import {
  E2xGraderCellToolbar, E2xGraderCellRegistry,
  GradingCellModel
} from '@e2xgrader/core';
import { Toolbar, lockIcon } from '@jupyterlab/ui-components';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import CellTypeSelector from "./CellTypeSelector";
import React from "react";
import TaskNameInput from "./TaskNameInput";
import PointsInput from "./PointsInput";
import {Message} from "@lumino/messaging";
import {Notebook} from "@jupyterlab/notebook";
import {TaskLinkModal} from "./TaskLinkModal";
import {TranslationBundle} from "@jupyterlab/translation";

export const SOLUTION_CELL_CLASS = 'e2xgrader-SolutionCell';
export const READ_ONLY_CELL_CLASS = 'e2xgrader-ReadOnlyCell';

export const LINK_TASK_BUTTON_CLASS = 'e2xgrader-link-task-button';
export const DISMISS_LINK_TASK_BUTTON_CLASS = 'e2xgrader-dismiss-link-task-button';

export class TeacherCellToolbar extends E2xGraderCellToolbar.CellToolbar {
  constructor(
    options: Toolbar.IOptions,
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    private _trans: TranslationBundle
  ) {
    super(options, registry);
    this.addClass('e2xgrader-TeacherCellToolbar');
  }

  update() {
    super.update();
    if (this.gradingCellModel?.isSolution) {
      this.addClass(SOLUTION_CELL_CLASS);
    }else{
      this.removeClass(SOLUTION_CELL_CLASS);
    }
    if (this.gradingCellModel?.isDescription) {
      this.addClass(READ_ONLY_CELL_CLASS);
    }else {
      this.removeClass(READ_ONLY_CELL_CLASS)
    }
  }

  get trans(): TranslationBundle{
    return this._trans;
  }

  protected onBeforeDetach(msg: Message) {
    super.onBeforeDetach(msg);
  }
}

export namespace TeacherCellToolbar {

  export class TeacherCellToolbarElement extends E2xGraderCellToolbar.ToolbarElement {
    constructor(teacherToolbar: TeacherCellToolbar, private _trans: TranslationBundle) {
      super(teacherToolbar);
    }

    get trans(): TranslationBundle{
      return this._trans;
    }
  }

  export class TypeSelector extends E2xGraderCellToolbar.ToolbarElement {
    setCellType(newType: string): void{
      if(this.gradingCellModel) {
        this.gradingCellModel.switchToCellType(this.cellRegistry, newType);
      }
      this.update();
      this.parent?.update();
    }

    renderElement(): React.JSX.Element {
      return (<div className="e2xgrader-CellType">
            <CellTypeSelector initialType={this.gradingCellModel?.gradingCellType ?? ''} onChange={e => this.setCellType(e)} cellRegistry={this.cellRegistry} />
          </div>);
    }
  }

  export class CellTaskNameInput extends E2xGraderCellToolbar.ToolbarElement {
    setTaskName(newName: string): void{
      if(!this.gradingCellModel) return;
      this.gradingCellModel.taskName = newName;
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel?.isSolution ? ( <div className="e2xgrader-TaskName">
        <TaskNameInput initialName={this.gradingCellModel?.taskName ?? ''} onChange={e => this.setTaskName(e)} />
      </div>) : (<></>);
    }
  }

  export class CellPointsInput extends E2xGraderCellToolbar.ToolbarElement {
    setPoints(newPoints: number): void{
      if(!this.gradingCellModel) return;
      this.gradingCellModel.points = newPoints;
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel?.isManualGradingCell || this.gradingCellModel?.isAutograderTest ? ( <div className="e2xgrader-Points">
        <label>Points: </label><PointsInput initialPoints={this.gradingCellModel?.nbgraderMetadata?.points ?? 0} onChange={e => this.setPoints(e)} />
      </div>) : (<></>);
    }
  }

  export class CellTaskLink extends TeacherCellToolbarElement {
    setLinkedTaskId(newId: string|undefined): void {
      if(!this.gradingCellModel) return;
      this.gradingCellModel.for = newId;
      this.update();
    }

    private getSolutionCells(): GradingCellModel[]{
      return (this.cell?.parent as Notebook).widgets.map(cell => new GradingCellModel(cell.model.sharedModel)).filter(cell => cell.isSolution);
    };

    private showSelectionDialog(): void {
    showDialog({
      title: this.trans.__('Task Link'),
      body: new TaskLinkModal(this.gradingCellModel?.for, this.getSolutionCells()),
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
      if(result.button.accept){
        this.setLinkedTaskId((!result.value || result.value === '-') ? undefined : (result.value as string));
      }
    });
  }

    renderElement(): React.JSX.Element {
      const solutionCells: GradingCellModel[] = this.getSolutionCells();
      const linkedTaskCell: GradingCellModel | undefined = solutionCells.find(cell => cell.id === this.gradingCellModel?.for);

      return this.gradingCellModel && (this.gradingCellModel?.isDescription || this.gradingCellModel?.isAutograderTest) ? (<div className="e2xgrader-TaskLink">
        <a onClick={() => this.showSelectionDialog()}>{this.gradingCellModel?.for ? `🔗 ${linkedTaskCell?.taskName}` : '+ link to task'}</a>
      </div>) : (<></>);
    }
  }

  export class CellLabel extends E2xGraderCellToolbar.ToolbarElement {
    renderElement(): React.JSX.Element {
      const isReadOnly = this.gradingCellModel?.isDescription;

      return (
        <div className="e2xgrader-CellLabel">
          {isReadOnly ? (
              <lockIcon.react className="e2xgrader-LockIcon" />
            ) : '' }
        </div>
      );
    }
  }

  export function createTeacherCellToolbar(
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    trans: TranslationBundle
  ): TeacherCellToolbar {
    const toolbar = new TeacherCellToolbar({}, registry, trans);
    toolbar.addItem('type', new TypeSelector(toolbar));
    toolbar.addItem('label', new CellLabel(toolbar));
    toolbar.addItem('task-name', new CellTaskNameInput(toolbar));
    toolbar.addItem('task-link', new CellTaskLink(toolbar, trans));
    toolbar.addItem('points', new CellPointsInput(toolbar));
    return toolbar;
  }
}
