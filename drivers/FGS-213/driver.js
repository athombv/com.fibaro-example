'use strict';

const Homey = require('homey');

class FibaroSingleSwitchTwoDevice extends Homey.Driver {

  onInit() {
    super.onInit();

    this.S1Trigger = this.homey.flow.getDeviceTriggerCard('FGS-213_S1')
    this.S1Trigger.registerRunListener((args, state) => {
      return args.device.switchTriggerRunListener(args, state);
    });
    this.S2Trigger = this.homey.flow.getDeviceTriggerCard('FGS-213_S2')
    this.S2Trigger.registerRunListener((args, state) => {
      return args.device.switchTriggerRunListener(args, state);
    });
    this.resetMeter = this.homey.flow.getActionCard('FGS-213_reset_meter')
    this.resetMeter.registerRunListener((args, state) => {
      return args.device.resetMeterRunListener(args, state);
    });
  }

}

module.exports = FibaroSingleSwitchTwoDevice;
