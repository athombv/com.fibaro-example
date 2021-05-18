'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroRollerShutterDevice extends ZwaveDevice {

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
  }

}

module.exports = FibaroRollerShutterDevice;
