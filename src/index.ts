import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the @e2xgrader/teacher extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@e2xgrader/teacher:plugin',
  description: 'A JupyterLab extension for e2xgrader teacher mode',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension @e2xgrader/teacher is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log(
            '@e2xgrader/teacher settings loaded:',
            settings.composite
          );
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for @e2xgrader/teacher.',
            reason
          );
        });
    }
  }
};

export default plugin;
