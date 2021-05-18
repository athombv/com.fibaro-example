'use strict';

const Homey = require('homey');

class FibaroRollerShutter24DeviceDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.momentaryTrigger = this.homey.flow.getDeviceTriggerCard('FGRM-222-momentary')
    this.momentaryTrigger.registerRunListener((args, state) => {
      return args.device.triggerRunListener(args, state);
    });
    this.toggleTrigger = this.homey.flow.getDeviceTriggerCard('FGRM-222-toggle')
    this.toggleTrigger.registerRunListener((args, state) => {
      return args.device.triggerRunListener(args, state);
    });
    this.singleGateTrigger = this.homey.flow.getDeviceTriggerCard('FGRM-222-momentary_single-gate_switch')
    this.singleGateTrigger.registerRunListener((args, state) => {
      return args.device.triggerRunListener(args, state);
    });

    this.resetMeterAction = this.homey.flow.getActionCard('FGRM-222_reset_meter')
    this.resetMeterAction.registerRunListener((args, state) => {
      return args.device.resetMeterRunListener(args, state);
    });
  }

}

module.exports = FibaroRollerShutter24DeviceDriver;
