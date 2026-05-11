import {
  E2xGraderCellToolbar, E2xGraderCellRegistry, NbgraderCellType, NbgraderCellTypes, NbgraderMetadata,
  GradingCellModel, E2xGraderMetadata
} from '@e2xgrader/core';
import { Toolbar, lockIcon } from '@jupyterlab/ui-components';
import CellTypeSelector from "./CellTypeSelector";
import React from "react";
import TaskNameInput from "./TaskNameInput";
import PointsInput from "./PointsInput";
import {Message} from "@lumino/messaging";
import TaskLink from "./TaskLink";

export const SOLUTION_CELL_CLASS = 'e2xgrader-SolutionCell';
export const READ_ONLY_CELL_CLASS = 'e2xgrader-ReadOnlyCell';

export class TeacherCellToolbar extends E2xGraderCellToolbar.CellToolbar {
  constructor(
    options: Toolbar.IOptions,
    registry: E2xGraderCellRegistry.IE2xGraderCellRegistry | undefined,
    private _gradingCells: GradingCellModel[]
  ) {
    super(options, registry);
    this.addClass('e2xgrader-TeacherCellToolbar');
  }

  get gradingCells(): GradingCellModel[] {
    return this._gradingCells;
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

  protected onAfterAttach(_msg: Message) {
    super.onAfterAttach(_msg);
    if(this.gradingCellModel) this.gradingCells.push(this.gradingCellModel);
  }

  protected onBeforeDetach(msg: Message) {
    super.onBeforeDetach(msg);
  }
}

export namespace TeacherCellToolbar {

  export class TeacherCellToolbarElement extends E2xGraderCellToolbar.ToolbarElement {
    constructor(private readonly _teacherToolbar: TeacherCellToolbar) {
      super(_teacherToolbar);
    }

    get gradingCells(): GradingCellModel[]{
      return this._teacherToolbar.gradingCells;
    }
  }

  export class TypeSelector extends E2xGraderCellToolbar.ToolbarElement {
    setCellType(newType: string): void{
      if(this.gradingCellModel) {
        if((Object.values(NbgraderCellType) as string[]).includes(newType)) {
          this.gradingCellModel.setNbgraderMetadataKey('cell_type', newType);
          this.gradingCellModel.setMetadata(E2xGraderMetadata.E2XGRADER_METADATA_KEY, E2xGraderMetadata.E2X_METADATA_DEFAULTS);
          this.gradingCellModel.setMetadata(NbgraderMetadata.NBGRADER_METADATA_KEY, NbgraderCellTypes.cellTypeConfigurations[newType as NbgraderCellType]);
          if(this.gradingCellModel.isSolution && !this.gradingCellModel.nbgraderMetadata?.task_name){
            this.gradingCellModel.setNbgraderMetadataKey('task_name', NbgraderMetadata.getRandomTaskName());
          }
        }else if(this.cellRegistry?.getPluginTypes().includes(newType)) {
          this.gradingCellModel.setMetadata('extended_cell', (this.cellRegistry.getPlugin(newType) as E2xGraderCellRegistry.IE2xGraderCellPlugin).cleanMetadata);
          this.gradingCellModel.setMetadata(NbgraderMetadata.NBGRADER_METADATA_KEY, NbgraderCellTypes.cellTypeConfigurations['manual']);
          this.gradingCellModel.setNbgraderMetadataKey('cell_type', undefined); //TODO verify if this is intended
        }else {
          this.gradingCellModel.removeNbgraderMetadata();
        }
      }
      this.update();
      this.parent?.update();
    }

    renderElement(): React.JSX.Element {
      console.log(this.cellRegistry?.getPlugins());
      return (<div className="e2xgrader-CellType">
            <CellTypeSelector initialType={this.gradingCellModel?.gradingCellType ?? ''} onChange={e => this.setCellType(e)} cellRegistry={this.cellRegistry} />
          </div>);
    }
  }

  export class CellTaskNameInput extends E2xGraderCellToolbar.ToolbarElement {
    setTaskName(newName: string): void{
      this.gradingCellModel?.setNbgraderMetadataKey('task_name', newName);
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel?.isSolution ? ( <div className="e2xgrader-TaskName">
        <TaskNameInput initialName={this.gradingCellModel?.nbgraderMetadata?.['task_name'] ?? ''} onChange={e => this.setTaskName(e)} />
      </div>) : (<></>);
    }
  }

  export class CellPointsInput extends E2xGraderCellToolbar.ToolbarElement {
    setPoints(newPoints: number): void{
      this.gradingCellModel?.setNbgraderMetadataKey('points', newPoints);
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel?.isManualGradingCell || this.gradingCellModel?.isAutograderTest ? ( <div className="e2xgrader-Points">
        <label>Points: </label><PointsInput initialPoints={this.gradingCellModel?.nbgraderMetadata?.['points'] ?? 0} onChange={e => this.setPoints(e)} />
      </div>) : (<></>);
    }
  }

  export class CellTaskLink extends TeacherCellToolbarElement {
    setLinkedTaskId(newId: string|undefined): void {
      this.gradingCellModel?.setNbgraderMetadataKey('for', newId);
    }

    renderElement(): React.JSX.Element {
      return this.gradingCellModel && (this.gradingCellModel?.isDescription || this.gradingCellModel?.isAutograderTest) ? (<div className="e2xgrader-TaskLink">
        <TaskLink initiallyLinkedTask={this.gradingCellModel?.nbgraderMetadata?.['for']} onChange={e => this.setLinkedTaskId(e)} gradingCells={this.gradingCells} />
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
    gradingCells: GradingCellModel[]
  ): TeacherCellToolbar {
    const toolbar = new TeacherCellToolbar({}, registry, gradingCells);
    toolbar.addItem('type', new TypeSelector(toolbar));
    toolbar.addItem('label', new CellLabel(toolbar));
    toolbar.addItem('task-name', new CellTaskNameInput(toolbar));
    toolbar.addItem('task-link', new CellTaskLink(toolbar));
    toolbar.addItem('points', new CellPointsInput(toolbar));
    return toolbar;
  }
}
