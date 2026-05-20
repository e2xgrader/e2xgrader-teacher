import {
  E2xGraderCellToolbar, E2xGraderCellRegistry,
  GradingCellModel, NbgraderCellType, NbgraderCellTypes
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
import {linkIcon} from "@jupyterlab/ui-components";

export const SOLUTION_CELL_CLASS = 'e2xgrader-SolutionCell';
export const READ_ONLY_CELL_CLASS = 'e2xgrader-ReadOnlyCell';

export const LINK_TASK_BUTTON_CLASS = 'e2xgrader-link-task-button';
export const DISMISS_LINK_TASK_BUTTON_CLASS = 'e2xgrader-dismiss-link-task-button';

export const PROCEED_BREAKING_TASK_LINKS_BUTTON_CLASS = 'e2xgrader-proceed-breaking-task-links-button';
export const DISMISS_BREAKING_TASK_LINKS_BUTTON_CLASS = 'e2xgrader-dismiss-breaking-task-links-button';

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
    constructor(toolbar: TeacherCellToolbar, private trans: TranslationBundle) {
      super(toolbar);
    }

    setCellType(newType: string): void{
      const proceedSettingType = (): void => {
        if(this.gradingCellModel) {
          this.gradingCellModel.switchToCellType(this.cellRegistry, newType);
        }
        this.update();
        this.parent?.update();
      }

      if(this.gradingCellModel?.isSolution                                                                // if the cell was a solution cell
          &&!(NbgraderCellTypes.cellTypeConfigurations[newType as NbgraderCellType]?.solution ?? false)){ // and the new cell type does not mark a solution cell
          const linkedCells: GradingCellModel[] = (this.cell?.parent as Notebook)?.widgets.map(cell => new GradingCellModel(cell.model.sharedModel)).filter(cell => cell.for === this.cell?.id) ?? [];
        if(linkedCells){
          showTaskLinkWarningDialog(this.trans).then(result => {
            if(result.button.accept){
              linkedCells.forEach(cell => cell.for = undefined);
              proceedSettingType();
            }
          })
        }else {
          proceedSettingType();
        }
      }else {
        proceedSettingType();
      }
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

  function showTaskLinkWarningDialog(trans: TranslationBundle): Promise<Dialog.IResult<unknown>> {
    return showDialog({
      title: trans.__('Task Link'),
      body: trans.__('Other cells are linked to this solution cell. Proceeding with this action will break these links!'),
      buttons: [
        Dialog.cancelButton({
          label: trans.__('Dismiss'),
          className: DISMISS_BREAKING_TASK_LINKS_BUTTON_CLASS
        }),
        Dialog.okButton({
          label: trans.__('Proceed and break links'),
          displayType: "warn",
          className: PROCEED_BREAKING_TASK_LINKS_BUTTON_CLASS
        })
      ]
    })
  }

  export class CellTaskLink extends TeacherCellToolbarElement {


    constructor(teacherToolbar: TeacherCellToolbar, trans: TranslationBundle) {
      super(teacherToolbar, trans);
      console.log('here');
    }

    activate() {
      this.setupChangeListener(); //TODO fix listerner setup
      super.activate();
    }

    dispose() {
      this.removeChangeListener();
      super.dispose();
    }

    private setupChangeListener(): void{
      const linkedTaskCell: GradingCellModel|undefined = this.findLinkedTaskCell(this.getSolutionCells());
      if(!linkedTaskCell) return;
      linkedTaskCell.metadataChanged.connect(() => this.updateTag());
    }

    private removeChangeListener(): void{
      const linkedTaskCell: GradingCellModel|undefined = this.findLinkedTaskCell(this.getSolutionCells());
      if(!linkedTaskCell) return;
      linkedTaskCell.metadataChanged.disconnect(() => this.updateTag());
    }

    private updateTag(): void{
      this.update();
      this.parent?.update();
    }

    setLinkedTaskId(newId: string|undefined): void {
      if(!this.gradingCellModel) return;
      this.removeChangeListener();
      this.gradingCellModel.for = newId;
      this.setupChangeListener();
      this.update();
    }

    private getSolutionCells(): GradingCellModel[]{
      return (this.cell?.parent as Notebook)?.widgets.map(cell => new GradingCellModel(cell.model.sharedModel)).filter(cell => cell.isSolution) ?? [];
    };

    private findLinkedTaskCell(solutionCells: GradingCellModel[]): GradingCellModel|undefined {
      return solutionCells.find(cell => cell.id === this.gradingCellModel?.for);
    }

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
      const linkedTaskCell: GradingCellModel | undefined = this.findLinkedTaskCell(solutionCells);

      return this.gradingCellModel && (this.gradingCellModel?.isDescription || this.gradingCellModel?.isAutograderTest) ? (this.gradingCellModel?.for ? (<div className="e2xgrader-TaskLink linked">
        <a onClick={() => this.showSelectionDialog()}><linkIcon.react className="e2xgrader-LinkIcon" /> {linkedTaskCell?.taskName}</a>
      </div>): (<div className="e2xgrader-TaskLink"><a onClick={() => this.showSelectionDialog()}>+ link to task</a></div>)) : (<></>);
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
    toolbar.addItem('type', new TypeSelector(toolbar, trans));
    toolbar.addItem('label', new CellLabel(toolbar));
    toolbar.addItem('task-name', new CellTaskNameInput(toolbar));
    toolbar.addItem('task-link', new CellTaskLink(toolbar, trans));
    toolbar.addItem('points', new CellPointsInput(toolbar));
    return toolbar;
  }
}
