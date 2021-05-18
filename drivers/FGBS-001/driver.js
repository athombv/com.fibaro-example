'use strict';

const Homey = require('homey');

class FibaroUniversalBinarySensorDriver extends Homey.Driver {

  onInit() {
    super.onInit();

    this.onTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-001_i1_on');
    this.offTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-001_i1_off');
    this.switchTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-001_i1_switch');

    this.onTrigger2 = this.homey.flow.getDeviceTriggerCard('FGBS-001_i2_on');
    this.offTrigger2 = this.homey.flow.getDeviceTriggerCard('FGBS-001_i2_off');
    this.switchTrigger2 = this.homey.flow.getDeviceTriggerCard('FGBS-001_i2_switch');

    this.temperatureTrigger = this.homey.flow.getDeviceTriggerCard('FGBS-001_temp1');
    this.temperatureTrigger2 = this.homey.flow.getDeviceTriggerCard('FGBS-001_temp2');
    this.temperatureTrigger3 = this.homey.flow.getDeviceTriggerCard('FGBS-001_temp3');
    this.temperatureTrigger4 = this.homey.flow.getDeviceTriggerCard('FGBS-001_temp4');

    this.i1Condition = this.homey.flow.getConditionCard('FGBS-001_i1');
    this.i1Condition.registerRunListener((args, state) => {
      return args.device.getCapabilityValue('alarm_generic.contact1');
    });

    this.i2Condition = this.homey.flow.getConditionCard('FGBS-001_i2');
    this.i2Condition.registerRunListener((args, state) => {
      return args.device.getCapabilityValue('alarm_generic.contact2');
    });
  }

}

module.exports = FibaroUniversalBinarySensorDriver;
