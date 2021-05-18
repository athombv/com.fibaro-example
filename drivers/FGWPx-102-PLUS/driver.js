'use strict';

const Homey = require('homey');

class FibaroWallPlugPlusDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.ledOnAction = this.homey.flow.getActionCard('FGWPx-102-PLUS_led_on');
    this.ledOnAction.registerRunListener(async (args, state) => {
      return args.device.ledOnRunListener(args, state);
    });
    this.ledOffAction = this.homey.flow.getActionCard('FGWPx-102-PLUS_led_off');
    this.ledOffAction.registerRunListener(async (args, state) => {
      return args.device.ledOffRunListener(args, state);
    });
  }

}

module.exports = FibaroWallPlugPlusDriver;
