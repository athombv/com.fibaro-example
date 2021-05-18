'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroWallPlugPlus extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
    this.registerCapability('meter_power', 'METER');

    this.registerSetting('kwh_threshold_report', value => value * 100);
  }

  async ledOnRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
        	return this.configurationSet({
        index: 41,
        size: 1,
        id: 'led_ring_color_on',
      }, new Buffer([args.color]));
    }
  }

  async ledOffRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 42,
        size: 1,
        id: 'led_ring_color_off',
      }, new Buffer([args.color]));
    }
  }

}

module.exports = FibaroWallPlugPlus;
