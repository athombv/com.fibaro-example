'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroDoubleSwitchDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('onoff', 'SWITCH_BINARY');
  }

}

module.exports = FibaroDoubleSwitchDevice;
