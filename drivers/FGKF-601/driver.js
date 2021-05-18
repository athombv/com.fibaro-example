'use strict';

const Homey = require('homey');

class FibaroKeyfobDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.sceneFlowTrigger = this.homey.flow.getDeviceTriggerCard('FGKF-601-scene');
    this.sceneFlowTrigger.registerRunListener((args, state) => {
      return args.device.sceneRunListener(args, state);
    });
    this.sequenceFlowTrigger = this.homey.flow.getDeviceTriggerCard('FGKF-601-sequence');
    this.sequenceFlowTrigger.registerRunListener((args, state) => {
      return args.device.sequenceRunListener(args, state);
    });
  }

}

module.exports = FibaroKeyfobDriver;
