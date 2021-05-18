'use strict';

const Homey = require('homey');

class FibaroDoubleSwitchTwoDevice extends Homey.Driver {

  onInit() {
    super.onInit();

    this.input1FlowTrigger = this.homey.flow.getDeviceTriggerCard('FGS-223_S1')
    this.input1FlowTrigger.registerRunListener((args, state) => {
      return args.device.inputFlowListener(args, state);
    });
    this.input2FlowTrigger = this.homey.flow.getDeviceTriggerCard('FGS-223_S2')
    this.input2FlowTrigger.registerRunListener((args, state) => {
      return args.device.inputFlowListener(args, state);
    });
    this.resetMeterFlowAction = this.homey.flow.getActionCard('FGS-223_reset_meter')
    this.resetMeterFlowAction.registerRunListener((args, state) => {
      return args.device.resetMeterFlowListener(args, state);
    });
  }

}

module.exports = FibaroDoubleSwitchTwoDevice;
