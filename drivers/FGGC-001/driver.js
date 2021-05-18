'use strict';

const Homey = require('homey');

class FibaroSwipeDeviceDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.directionTrigger = this.homey.flow.getDeviceTriggerCard('fggc-001_swipe_direction')
    this.directionTrigger.registerRunListener((args, state) => {
      return args.device.directionRunListener(args, state);
    });

    this.roundTrigger = this.homey.flow.getDeviceTriggerCard('fggc-001_swipe_round')
    this.roundTrigger.registerRunListener((args, state) => {
      return args.device.roundRunListener(args, state);
    });

    this.sequenceTrigger = this.homey.flow.getDeviceTriggerCard('fggc-001_swipe_sequence')
    this.sequenceTrigger.registerRunListener((args, state) => {
      return args.device.sequenceRunListener(args, state);
    });
  }

}

module.exports = FibaroSwipeDeviceDriver;
