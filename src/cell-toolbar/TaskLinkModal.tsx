import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import TaskLinkSelector from '../task-properties/control-widgets/TaskLinkSelector';
import {E2xGraderMetadata, GradingCellModel} from '@e2xgrader/core';
import {Notebook} from "@jupyterlab/notebook";
import {findAllTasks} from "./util";

export const TASK_LINK_MODAL_CLASS = 'e2x-task-link-modal';

export class TaskLinkModal extends ReactWidget {
  private currentValue: E2xGraderMetadata.IE2xGraderTaskMetadata | undefined;

  constructor(
    private notebook: Notebook,
    private currentCell: GradingCellModel
  ) {
    super();
    this.currentValue = this.currentCell.task;
  }

  render(): React.JSX.Element {
    const tasks: E2xGraderMetadata.IE2xGraderTaskMetadata[] = findAllTasks(this.notebook);
    return (
      <div className={TASK_LINK_MODAL_CLASS + ' e2x-controls'}>
        <TaskLinkSelector
          initiallyLinkedTask={this.currentValue}
          onChange={e => {
            this.currentValue = e;
          }}
          tasks={tasks}
        />
      </div>
    );
  }

  getValue(): E2xGraderMetadata.IE2xGraderTaskMetadata | undefined {
    return this.currentValue;
  }
}
