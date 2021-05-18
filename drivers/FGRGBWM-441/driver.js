'use strict';

const Homey = require('homey');

class FibaroRGBWControllerDeviceDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.onFlowTrigger = this.homey.flow.getDeviceTriggerCard('RGBW_input_on')
    this.onFlowTrigger.registerRunListener((args, state) => {
      return args.device.onOffFlowRunListener(args, state);
    });
    this.offFlowTrigger = this.homey.flow.getDeviceTriggerCard('RGBW_input_off')
    this.offFlowTrigger.registerRunListener((args, state) => {
      return args.device.onOffFlowRunListener(args, state);
    });

    this.input1FlowTrigger = this.homey.flow.getDeviceTriggerCard('RGBW_volt_input1');
    this.input2FlowTrigger = this.homey.flow.getDeviceTriggerCard('RGBW_volt_input2');
    this.input3FlowTrigger = this.homey.flow.getDeviceTriggerCard('RGBW_volt_input3');
    this.input4FlowTrigger = this.homey.flow.getDeviceTriggerCard('RGBW_volt_input4');

    this.specificColorAction = this.homey.flow.getActionCard('RGBW_specific');
    this.specificColorAction.registerRunListener((args, state) => {
      return args.device.specificColorRunListener(args, state);
    });
    this.animationAction = this.homey.flow.getActionCard('RGBW_animation');
    this.animationAction.registerRunListener((args, state) => {
      return args.device.animationRunListener(args, state);
    });
  }

}

module.exports = FibaroRGBWControllerDeviceDriver;
