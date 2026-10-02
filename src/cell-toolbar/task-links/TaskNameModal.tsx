import {ReactWidget} from "@jupyterlab/ui-components";
import {Notebook} from "@jupyterlab/notebook";
import React from "react";
import {findAllTasks} from "./util";
import TaskNameInput, {TASK_NAME_MAX_LENGTH, TASK_NAME_MIN_LENGTH} from "../TaskNameInput";
import {TranslationBundle} from "@jupyterlab/translation";
import {E2xGraderMetadata} from "@e2xgrader/core";

export const TASK_NAME_MODAL_CLASS = 'e2x-task-name-modal';

export class TaskNameModal extends ReactWidget {
  private errorMessage?: string;

  constructor(
    private notebook: Notebook,
    private currentValue: E2xGraderMetadata.IE2xGraderTaskMetadata,
    private trans: TranslationBundle
  ) {
    super();
  }

  updateName(newName: string) {
    this.currentValue.name = newName;
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

  render(): React.JSX.Element {
    const otherTaskNames: string[] = findAllTasks(this.notebook).filter(task => task.id !== this.currentValue.id).map(task => task.name);
    return (
      <div className={TASK_NAME_MODAL_CLASS + ' e2x-controls'}>
        <TaskNameInput initialName={this.currentValue.name} onChange={e => this.updateName(e)} otherTaskNames={otherTaskNames} onError={e => this.handleErrors(e)} />
        {this.errorMessage ? <span></span> : (<></>) }
      </div>
    );
  }

  getValue(): {isValid: boolean, task: E2xGraderMetadata.IE2xGraderTaskMetadata} {
    return {isValid: this.errorMessage === undefined, task: this.currentValue};
  }
}