'use strict';

const Homey = require('homey');

class FibaroUniversalBinarySensorDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.input1OnTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_i1_on');
    this.input1OffTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_i1_off');
    this.input1SwitchTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_i1_switch');

    this.input2OnTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_i2_on');
    this.input2OffTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_i2_off');
    this.input2SwitchTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_i2_switch');

    this.analogInput1FlowTrigger = this.homey.flow.getDeviceTriggerCard('analog_input_1');
    this.analogInput2FlowTrigger = this.homey.flow.getDeviceTriggerCard('analog_input_2');

    // Temperature trigger cards
    this.internalTemperatureTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp_internal');
    this.temperature1Trigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp1');
    this.temperature2Trigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp2');
    this.temperature3Trigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp3');
    this.temperature4Trigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp4');
    this.temperature5Trigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp5');
    this.temperature6Trigger = this.homey.flow.getDeviceTriggerCard('FGBS-222_temp6');

    // Input condition cards

    this.input1Condition = this.homey.flow.getConditionCard('FGBS-222_i1_state')
    this.input1Condition.registerRunListener((args, state) => {
      return !args.device.getCapabilityValue('alarm_generic.input1');
    });

    this.input2Condition = this.homey.flow.getConditionCard('FGBS-222_i2_state')
    this.input2Condition.registerRunListener((args, state) => {
      return !args.device.getCapabilityValue('alarm_generic.input2');
    });

    // Output action cards
    this.output1OnAction = this.homey.flow.getActionCard('FGBS-222_o1_on')
    this.output1OnAction.registerRunListener((args, state) => {
      return args.device.triggerCapabilityListener('onoff.output1', true);
    });
    this.output1OffAction = this.homey.flow.getActionCard('FGBS-222_o1_off')
    this.output1OffAction.registerRunListener((args, state) => {
      return args.device.triggerCapabilityListener('onoff.output1', false);
    });
    this.output1ToggleAction = this.homey.flow.getActionCard('FGBS-222_o1_toggle')
    this.output1ToggleAction.registerRunListener((args, state) => {
      return args.device.triggerCapabilityListener('onoff.output1', !args.device.getCapabilityValue('onoff.output1'));
    });
    this.output2OnAction = this.homey.flow.getActionCard('FGBS-222_o2_on')
    this.output2OnAction.registerRunListener((args, state) => {
      return args.device.triggerCapabilityListener('onoff.output2', true);
    });
    this.output2OffAction = this.homey.flow.getActionCard('FGBS-222_o2_off')
    this.output2OffAction.registerRunListener((args, state) => {
      return args.device.triggerCapabilityListener('onoff.output2', false);
    });
    this.output2ToggleAction = this.homey.flow.getActionCard('FGBS-222_o2_toggle')
    this.output2ToggleAction.registerRunListener((args, state) => {
      return args.device.triggerCapabilityListener('onoff.output2', !args.device.getCapabilityValue('onoff.output2'));
    });
  }

}

module.exports = FibaroUniversalBinarySensorDriver;
