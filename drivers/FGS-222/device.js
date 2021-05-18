'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroDoubleRelaySwitchTwoDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('onoff', 'SWITCH_BINARY');
  }

}

module.exports = FibaroDoubleRelaySwitchTwoDevice;
