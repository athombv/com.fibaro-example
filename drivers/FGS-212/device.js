'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroRelaySwitchTwoDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('onoff', 'SWITCH_BINARY');
  }

}

module.exports = FibaroRelaySwitchTwoDevice;
