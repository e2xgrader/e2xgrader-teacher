import {E2XContentFactory, GradingCellModel} from "@e2xgrader/core";
import { ICellHeader } from '@jupyterlab/cells';
import {TeacherCellToolbar} from "./toolbar";

export class E2XContentFactoryTeacher extends E2XContentFactory {
  private gradingCells: GradingCellModel[] = [];

  createCellHeader(): ICellHeader {
    return TeacherCellToolbar.createTeacherCellToolbar(this.cellRegistry, this.gradingCells);
  }
}