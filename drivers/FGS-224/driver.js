'use strict';

const Homey = require('homey');

class FibaroDoubleSmartModuleDevice extends Homey.Driver {

  onInit() {
    super.onInit();

    this.input1FlowTrigger = this.homey.flow.getDeviceTriggerCard('FGS-224_S1');
    this.input1FlowTrigger.registerRunListener((args, state) => {
      return args.device.inputFlowListener(args, state);
    });

    this.input2FlowTrigger = this.homey.flow.getDeviceTriggerCard('FGS-224_S2');
    this.input2FlowTrigger.registerRunListener((args, state) => {
      return args.device.inputFlowListener(args, state);
    });
  }

}

module.exports = FibaroDoubleSmartModuleDevice;
