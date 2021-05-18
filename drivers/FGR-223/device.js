'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroRollerShutter3Device extends ZwaveDevice {

  onNodeInit() {
    /*
     * WARNING: Please DO NOT remove the `dim` capability.
     * Legacy Fibaro Roller Shutter devices use this capability!
     */
    if (this.hasCapability('windowcoverings_set')) {
      this.registerCapability('windowcoverings_set', 'SWITCH_MULTILEVEL');
    } else if (this.hasCapability('dim')) {
      this.registerCapability('dim', 'SWITCH_MULTILEVEL');
    }
    this.registerCapability('measure_power', 'METER');
    this.registerCapability('meter_power', 'METER');

    this.registerSetting('start_calibration', newValue => {
      if (newValue) {
        setTimeout(() => {
          this.setSettings({start_calibration: false});
        }, 5000);
      }

      return new Buffer([newValue ? 2 : 0]);
    });
  }

}

module.exports = FibaroRollerShutter3Device;
