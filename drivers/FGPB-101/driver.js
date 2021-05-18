'use strict';

const Homey = require('homey');

class ButtonDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.onButtonTrigger = this.homey.flow.getDeviceTriggerCard('FGPB-101');
    this.onButtonTrigger.registerRunListener((args, state) => {
      return args.device.buttonRunListener(args, state);
    });
  }

}

module.exports = ButtonDriver;
