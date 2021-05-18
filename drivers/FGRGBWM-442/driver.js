'use strict';

const Homey = require('homey');

class FibaroRGBW2Driver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.onFlowTrigger = this.homey.flow.getDeviceTriggerCard('input_on')
    this.onFlowTrigger.registerRunListener((args, state) => {
      return args.device.onOffFlowRunListener(args, state);
    });
    this.offFlowTrigger = this.homey.flow.getDeviceTriggerCard('input_off')
    this.offFlowTrigger.registerRunListener((args, state) => {
      return args.device.onOffFlowRunListener(args, state);
    });

    this.analogInputFlowTrigger = this.homey.flow.getDeviceTriggerCard('analog_input');

    this.animationAction = this.homey.flow.getActionCard('RGBW_animation')
    this.animationAction.registerRunListener((args, state) => {
      return args.device.animationRunListener(args, state);
    });
  }

}

module.exports = FibaroRGBW2Driver;
