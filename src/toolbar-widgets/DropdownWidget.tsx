import {ReactWidget, Toolbar, ToolbarButtonComponent} from "@jupyterlab/ui-components";
import {TranslationBundle, nullTranslator, ITranslator} from '@jupyterlab/translation';
import { NotebookPanel } from "@jupyterlab/notebook";
import { Widget } from '@lumino/widgets';

export const TOOLBAR_DROPDOWN_WIDGET_CLASS: string = 'e2x-Notebook-toolbarDropdownWidget';
export const TOOLBAR_DROPDOWN_WIDGET_DROPDOWN_CLASS: string = 'e2x-Notebook-toolbarDropdownWidget-dropdown';

export function createDropdownWidget(panel: NotebookPanel, translator: ITranslator): ReactWidget{
    return new DropdownWidget(panel.toolbar, translator);
}

export class DropdownWidget extends ReactWidget {
    private _trans: TranslationBundle;
    private _showDropdown: boolean = false;

    constructor(toolbarWidget: Toolbar<Widget>, translator: ITranslator) {
        super();
        this.addClass(TOOLBAR_DROPDOWN_WIDGET_CLASS);
        this._trans = (translator || nullTranslator).load('e2xgrader_teacher');
    }

    handleButtonClick(): void{
        this._showDropdown = !this._showDropdown;
    }

    render(): JSX.Element {
    return (
      <div>
        <ToolbarButtonComponent
          tooltip={this._trans.__('toggle dropdown')}
          label={this._trans.__('Additional Resources')}
          //icon={bookIcon}
          iconClass={'reduce-icon-size'}
          onClick={this.handleButtonClick}
        />
        {this._showDropdown && (
          <ul className={TOOLBAR_DROPDOWN_WIDGET_DROPDOWN_CLASS}>
            {this._additionalResources.map(resource => {
              return (
                <li>
                  <a
                    target="_blank"
                    href={resource.path}
                    onClick={this.handleLinkClick}
                  >
                    {resource.label}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
}