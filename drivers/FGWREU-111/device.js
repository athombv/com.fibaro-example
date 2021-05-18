'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroRollerShutterDevice extends ZwaveDevice {

  onNodeInit() {
    // this.printNode();
    // this.enableDebug();

    this.registerCapability(
      'windowcoverings_set',
      'SWITCH_MULTILEVEL',
    );

    this.registerCapability(
      'windowcoverings_tilt_set',
      'SWITCH_MULTILEVEL',
      { multiChannelNodeId: 2 },
    );

    this.registerSetting('start_calibration', newValue => {
      if (newValue) {
        setTimeout(() => {
          this.setSettings({ start_calibration: false });
        }, 5000);
      }

      return new Buffer([newValue ? 2 : 0]);
    });

    this.registerSetting('blind_type', newValue => {
      this.log('Blind type', newValue);
      if (newValue === 1) this.addCapability('windowcoverings_tilt_set');
      else this.removeCapability('windowcoverings_tilt_set');
      return new Buffer([newValue]);
    });
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

module.exports = FibaroRollerShutterDevice;
