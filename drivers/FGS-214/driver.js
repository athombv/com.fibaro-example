'use strict';

const Homey = require('homey');

class FibaroSingleSwitchTwoDevice extends Homey.Driver {

  onInit() {
    super.onInit();

    this.S1Trigger = this.homey.flow.getDeviceTriggerCard('FGS-214_S1');
    this.S1Trigger.registerRunListener((args, state) => {
      return args.device.switchTriggerRunListener(args, state);
    });
    this.S2Trigger = this.homey.flow.getDeviceTriggerCard('FGS-214_S2');
    this.S2Trigger.registerRunListener((args, state) => {
      return args.device.switchTriggerRunListener(args, state);
    });
  }

}

module.exports = FibaroSingleSwitchTwoDevice;
