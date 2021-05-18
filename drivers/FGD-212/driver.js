'use strict';

const Homey = require('homey');

class FibaroDimmerTwoDeviceDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.momentaryTrigger = this.homey.flow.getDeviceTriggerCard('FGD-212_momentary')
    this.momentaryTrigger.registerRunListener((args, state) => {
      return args.device.switchTriggersRunListener(args, state);
    });

    this.toggleTrigger = this.homey.flow.getDeviceTriggerCard('FGD-212_toggle')
    this.toggleTrigger.registerRunListener((args, state) => {
      return args.device.switchTriggersRunListener(args, state);
    });

    this.rollerTrigger = this.homey.flow.getDeviceTriggerCard('FGD-212_roller')
    this.rollerTrigger.registerRunListener((args, state) => {
      return args.device.switchTriggersRunListener(args, state);
    });

    this.brightnessAction = this.homey.flow.getActionCard('FGD-212_set_brightness')
    this.brightnessAction.registerRunListener((args, state) => {
      return args.device.setBrightnessRunListener(args, state);
    });
    this.dimDurationAction = this.homey.flow.getActionCard('FGD-212_dim_duration')
    this.dimDurationAction.registerRunListener((args, state) => {
      return args.device.dimDurationRunListener(args, state);
    });
    this.setTimerAction = this.homey.flow.getActionCard('FGD-212_set_timer')
    this.setTimerAction.registerRunListener((args, state) => {
      return args.device.setTimerRunListener(args, state);
    });
    this.resetMeterAction = this.homey.flow.getActionCard('FGD-212_reset_meter')
    this.resetMeterAction.registerRunListener((args, state) => {
      return args.device.resetMeterRunListener(args, state);
    });
  }

}

module.exports = FibaroDimmerTwoDeviceDriver;
