import { Dialog } from '@jupyterlab/apputils';

export function showFormDialog<T>(
  options: Partial<FormDialog.IOptions<T>> = {}
): Promise<Dialog.IResult<T>> {
  const dialog = new FormDialog(options);
  return dialog.launch();
}

export class FormDialog<T> extends Dialog<T> {
  private readonly _dBtn: number;
  private readonly _canActivateFunctions: (() => boolean)[];

  constructor(options: Partial<FormDialog.IOptions<T>> = {}) {
    super(options);
    this._dBtn = options.defaultButton ?? (options.buttons?.length ?? 2) - 1;
    this._canActivateFunctions = options.buttons?.map(
      button => button.canActivate ?? (() => true)
    ) ?? [() => true, () => true];
  }

  resolve(index?: number) {
    if (index === undefined) {
      index = this._dBtn;
    }
    if (!this._canActivateFunctions[index]()) {
      return;
    }
    super.resolve(index);
  }
}

export namespace FormDialog {
  export interface IOptions<T> extends Dialog.IOptions<T> {
    buttons: ReadonlyArray<FormDialog.IButton>;
  }

  export interface IButton extends Dialog.IButton {
    canActivate?: () => boolean;
  }

  export function createButton(
    value: Partial<FormDialog.IButton>
  ): Readonly<FormDialog.IButton> {
    return Private.includeCanActivateFunction(
      Dialog.createButton(value),
      value.canActivate
    );
  }

  export function cancelButton(
    options: Partial<FormDialog.IButton> = {}
  ): Readonly<FormDialog.IButton> {
    return Private.includeCanActivateFunction(
      Dialog.cancelButton(options),
      options.canActivate
    );
  }

  export function okButton(
    options: Partial<FormDialog.IButton> = {}
  ): Readonly<FormDialog.IButton> {
    return Private.includeCanActivateFunction(
      Dialog.okButton(options),
      options.canActivate
    );
  }

  export function warnButton(
    options: Partial<FormDialog.IButton> = {}
  ): Readonly<FormDialog.IButton> {
    return Private.includeCanActivateFunction(
      Dialog.warnButton(options),
      options.canActivate
    );
  }
}

namespace Private {
  export function includeCanActivateFunction(
    button: Readonly<Dialog.IButton>,
    canActivateFunction?: () => boolean
  ): Readonly<FormDialog.IButton> {
    return { ...button, canActivate: canActivateFunction };
  }
}
