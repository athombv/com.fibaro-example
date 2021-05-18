'use strict';

const Homey = require('homey');

class FibaroWalliWallOutletDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.ledOnAction = this.homey.flow.getActionCard('walli_led_on');
    this.ledOnAction.registerRunListener((args, state) => {
      return args.device.ledOnRunListener(args, state);
    });
    this.ledOffAction = this.homey.flow.getActionCard('walli_led_off');
    this.ledOffAction.registerRunListener((args, state) => {
      return args.device.ledOffRunListener(args, state);
    });
  }

}

module.exports = FibaroWalliWallOutletDriver;
