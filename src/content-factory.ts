import {E2XContentFactory, E2xGraderCellRegistry} from "@e2xgrader/core";
import { Cell, ICellHeader } from '@jupyterlab/cells';
import {TeacherCellToolbar} from "./toolbar";
import {TranslationBundle} from "@jupyterlab/translation";
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Signal } from '@lumino/signaling';

export class E2XContentFactoryTeacher extends E2XContentFactory {
  private readonly _cellMetaDataChange: Signal<E2XContentFactory, string>;
  constructor(options: Cell.ContentFactory.IOptions, settings: ISettingRegistry.ISettings|undefined, registry: E2xGraderCellRegistry.IE2xGraderCellRegistry|undefined, private trans: TranslationBundle) {
    super(options, settings, registry);
    this._cellMetaDataChange = new Signal<E2XContentFactory, string>(this);
  }

  createCellHeader(): ICellHeader {
    return TeacherCellToolbar.createTeacherCellToolbar(this.cellRegistry, this.trans, this._cellMetaDataChange);
  }
}