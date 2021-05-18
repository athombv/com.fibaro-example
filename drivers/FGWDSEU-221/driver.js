'use strict';

const Homey = require('homey');

class FibaroWalliSwitchDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.outputOnAction = this.homey.flow.getActionCard('walli_switch_turn_on')
    this.outputOnAction.registerRunListener((args, state) => {
      return args.device.setOutputRunListener(args, state, true);
    })

    this.outputOffAction = this.homey.flow.getActionCard('walli_switch_turn_off')
    this.outputOffAction.registerRunListener((args, state) => {
      return args.device.setOutputRunListener(args, state, false);
    })

    this.outputToggleAction = this.homey.flow.getActionCard('walli_switch_toggle')
    this.outputToggleAction.registerRunListener((args, state) => {
      this.log('Changing state to:', !args.device.getCapabilityValue(`onoff.output${args.output}`));
      return args.device.setOutputRunListener(args, state,
        !args.device.getCapabilityValue(`onoff.output${args.output}`));
    })

    this.ledOnAction = this.homey.flow.getActionCard('walli_led_on')
    this.ledOnAction.registerRunListener((args, state) => {
      return args.device.ledOnRunListener(args, state);
    })
    this.ledOffAction = this.homey.flow.getActionCard('walli_led_off')
    this.ledOffAction.registerRunListener((args, state) => {
      return args.device.ledOffRunListener(args, state);
    })

    this.buttonSceneTrigger = this.homey.flow.getDeviceTriggerCard('walli_switch_button_scenes')
    this.buttonSceneTrigger.registerRunListener((args, state) => {
      this.log('Triggering scene flow', args.button == state.button && args.presses == state.presses);
      return args.button == state.button && args.presses == state.presses;
    })

    this.powerChangedTrigger = this.homey.flow.getDeviceTriggerCard('walli_switch_power_changed')
    this.powerChangedTrigger.registerRunListener((args, state) => {
      this.log(args, state);
      return args.output == state.output;
    })
  }

}

module.exports = FibaroWalliSwitchDriver;
