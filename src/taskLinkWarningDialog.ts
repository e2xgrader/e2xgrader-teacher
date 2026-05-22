import {TranslationBundle} from "@jupyterlab/translation";
import {Dialog, showDialog} from "@jupyterlab/apputils";

export const PROCEED_BREAKING_TASK_LINKS_BUTTON_CLASS = 'e2xgrader-proceed-breaking-task-links-button';
export const DISMISS_BREAKING_TASK_LINKS_BUTTON_CLASS = 'e2xgrader-dismiss-breaking-task-links-button';

export function showTaskLinkWarningDialog(trans: TranslationBundle): Promise<Dialog.IResult<unknown>> {
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