'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class FibaroWalliDimmerDevice extends ZwaveDevice {

  onNodeInit() {
    this._momentaryTrigger = this.driver.momentaryTrigger;
    this._toggleTrigger = this.driver.toggleTrigger;
    this._rollerTrigger = this.driver.rollerTrigger;

    this.registerCapability('onoff', 'SWITCH_MULTILEVEL');
    this.registerCapability('dim', 'SWITCH_MULTILEVEL');

    this.registerCapability('measure_power', 'METER');
    this.registerCapability('meter_power', 'METER');
  }

  switchTriggersRunListener(args, state) {
    return state && args && state.scene === args.scene;
  }

  async ledOnRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 11,
        size: 1,
        id: 'led_ring_color_on',
      }, new Buffer([args.color]));
    }
  }

  async ledOffRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 12,
        size: 1,
        id: 'led_ring_color_off',
      }, new Buffer([args.color]));
    }
  }

}

module.exports = FibaroWalliDimmerDevice;
