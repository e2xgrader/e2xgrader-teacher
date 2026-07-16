import { Dialog } from '@jupyterlab/apputils';
import { TranslationBundle } from '@jupyterlab/translation';
import { ReactWidget } from '@jupyterlab/ui-components';
import * as React from 'react';
import TaskNameInput, {
  TASK_NAME_MAX_LENGTH,
  TASK_NAME_MIN_LENGTH
} from './cell-toolbar/TaskNameInput';
import PointsInput from './cell-toolbar/PointsInput';
import { FormDialog, showFormDialog } from './FormDialog';

export const TASK_PROPERTIES_DIALOG_CLASS = 'e2x-task-properties-dialog';
export const INPUT_VALIDATION_ERROR_SPAN_CLASS = 'e2x-input-validation-error';

export async function showTaskPropertiesDialog(
  trans: TranslationBundle,
  isNewTask: boolean = true
): Promise<Dialog.IResult<{ taskName: string; points: number }>> {
  const body = new TaskPropertiesDialogBody(trans);
  return showFormDialog({
    title: trans.__('Task Properties'),
    body: body,
    buttons: [
      Dialog.cancelButton({
        label: trans.__('Cancel')
      }),
      isNewTask
        ? FormDialog.createButton({
            label: trans.__('Add Task'),
            canActivate: () => body.isValid()
          })
        : FormDialog.okButton({
            label: trans.__('Save'),
            canActivate: () => body.isValid()
          })
    ]
  });
}

class TaskPropertiesDialogBody extends ReactWidget {
  private _taskName: string = '';
  private _points: number = 0;
  private _taskNameErrorMessage: string | undefined;
  private _pointsErrorMessage: string | undefined;
  private _isTaskNameTouched: boolean = false;
  private _isPointsTouched: boolean = false;

  constructor(private _trans: TranslationBundle) {
    super();
  }

  handleTaskNameErrors(errors: string[]): void {
    if (errors.includes('duplicate')) {
      this._taskNameErrorMessage = this._trans.__(
        'This task name is already in use. Please choose a unique task name.'
      );
    } else if (errors.includes('minLength')) {
      this._taskNameErrorMessage = this._trans._n(
        `The task name must be at least ${TASK_NAME_MIN_LENGTH} character long!`,
        `The task name must be at least ${TASK_NAME_MIN_LENGTH} characters long!`,
        TASK_NAME_MIN_LENGTH
      );
    } else if (errors.includes('maxLength')) {
      this._taskNameErrorMessage = this._trans.__(
        `The task name must not be more than ${TASK_NAME_MAX_LENGTH} characters long!`
      );
    } else {
      this._taskNameErrorMessage = undefined;
    }
    this.update();
  }

  handleTaskNameTouched(): void {
    this._isTaskNameTouched = true;
  }

  handlePointsErrors(errors: string[]): void {
    if (errors.includes('finiteNumber')) {
      this._pointsErrorMessage = this._trans.__(
        'Points must be a finite number'
      );
    } else if (errors.includes('min')) {
      this._pointsErrorMessage = this._trans.__('Points must be at least 0');
    } else {
      this._pointsErrorMessage = undefined;
    }
    this.update();
  }

  handlepointsTouched(): void {
    this._isPointsTouched = true;
  }

  isValid(): boolean {
    return !this._taskNameErrorMessage && !this._pointsErrorMessage;
  }

  protected render(): React.JSX.Element {
    const taskNameInputLabel: string = this._trans.__('Task Name');
    const pointsInputLabel: string = this._trans.__('Points');
    return (
      <div className={TASK_PROPERTIES_DIALOG_CLASS + ' e2x-controls'}>
        <div className={'form-group'}>
          <label>{taskNameInputLabel} *</label>
          <TaskNameInput
            initialName={''}
            onChange={e => {
              this._taskName = e;
            }}
            otherTaskNames={[]}
            onError={e => this.handleTaskNameErrors(e)}
            onTouched={() => this.handleTaskNameTouched()}
          />
          <span className={INPUT_VALIDATION_ERROR_SPAN_CLASS}>
            {this._isTaskNameTouched ? this._taskNameErrorMessage : ''}
          </span>
        </div>
        <div className={'form-group'}>
          <label>{pointsInputLabel} *</label>
          <PointsInput
            initialPoints={0}
            onChange={e => {
              this._points = e;
            }}
            onError={e => this.handlePointsErrors(e)}
            onTouched={() => this.handlepointsTouched()}
          />
          <span className={INPUT_VALIDATION_ERROR_SPAN_CLASS}>
            {this._isPointsTouched ? this._pointsErrorMessage : ''}
          </span>
        </div>
      </div>
    );
  }

  getValue(): { taskName: string; points: number } {
    return { taskName: this._taskName, points: this._points };
  }
}
