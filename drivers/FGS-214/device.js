'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class FibaroSmartModuleDevice extends ZwaveDevice {

  onNodeInit() {
    this._S1Trigger = this.driver.S1Trigger;
    this._S2Trigger = this.driver.S2Trigger;

    this.registerCapability('onoff', 'SWITCH_BINARY');

    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      if (report.hasOwnProperty('Properties1')
                && report.Properties1.hasOwnProperty('Key Attributes')
                && report.hasOwnProperty('Scene Number')) {
        const state = {
          scene: report.Properties1['Key Attributes'],
        };

        if (report['Scene Number'] === 1) {
          this._S1Trigger.trigger(this, null, state);
        } else if (report['Scene Number'] === 2) {
          this._S2Trigger.trigger(this, null, state);
        }
      }
    });
  }

  switchTriggerRunListener(args, state) {
    return (state && args
      && state.hasOwnProperty('scene') && args.hasOwnProperty('scene')
      && state.scene === args.scene);
  }

}

module.exports = FibaroSmartModuleDevice;
