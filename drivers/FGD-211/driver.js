'use strict';

const Homey = require('homey');

class FibaroDimmerDeviceDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.momentaryTrigger = this.homey.flow.getDeviceTriggerCard('FGD-211_momentary')
      .registerRunListener((args, state) => {
        return args.device.switchTriggersRunListener(args, state);
      });
    this.toggleTrigger = this.homey.flow.getDeviceTriggerCard('FGD-211_toggle')
      .registerRunListener((args, state) => {
        return args.device.switchTriggersRunListener(args, state);
      });
    this.rollerTrigger = this.homey.flow.getDeviceTriggerCard('FGD-211_roller')
      .registerRunListener((args, state) => {
        return args.device.switchTriggersRunListener(args, state);
      });
  }

}

module.exports = FibaroDimmerDeviceDriver;
