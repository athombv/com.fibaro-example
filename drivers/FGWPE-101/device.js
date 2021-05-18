'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroWallPlug extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
    this.registerCapability('meter_power', 'METER');

    this.registerSetting('always_on', value => {
      // Flip 0 = 1, 1 = 0, because 0 is active and 1 is inactive
      return new Buffer([value === true ? 0 : 1]);
    });
  }

  async ledOnRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 61,
        size: 1,
        id: 'led_ring_color_on',
      }, new Buffer([args.color]));
    }
  }

  async ledOffRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 62,
        size: 1,
        id: 'led_ring_color_off',
      }, new Buffer([args.color]));
    }
  }

}

module.exports = FibaroWallPlug;
