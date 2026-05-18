import {E2XContentFactory, E2xGraderCellRegistry} from "@e2xgrader/core";
import { Cell, ICellHeader } from '@jupyterlab/cells';
import {TeacherCellToolbar} from "./toolbar";
import {TranslationBundle} from "@jupyterlab/translation";
import { ISettingRegistry } from '@jupyterlab/settingregistry';

export class E2XContentFactoryTeacher extends E2XContentFactory {
  constructor(options: Cell.ContentFactory.IOptions, settings: ISettingRegistry.ISettings|undefined, registry: E2xGraderCellRegistry.IE2xGraderCellRegistry|undefined, private trans: TranslationBundle) {
    super(options, settings, registry);
  }

  createCellHeader(): ICellHeader {
    return TeacherCellToolbar.createTeacherCellToolbar(this.cellRegistry, this.trans);
  }
}