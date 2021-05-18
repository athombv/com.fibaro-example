'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroRelaySwitchDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('onoff', 'SWITCH_BINARY');
  }

}

module.exports = FibaroRelaySwitchDevice;
