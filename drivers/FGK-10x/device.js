'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroDoorSensorPlus extends ZwaveDevice {

  async onNodeInit() {
    this.registerCapability('alarm_contact', 'NOTIFICATION');
    this.registerCapability('alarm_tamper', 'NOTIFICATION');

    if (this.node.CommandClass.COMMAND_CLASS_SENSOR_MULTILEVEL) {
      this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
        getOnStart: false,
      });
    }

    this.registerCapability('measure_battery', 'BATTERY');
  }

}

module.exports = FibaroDoorSensorPlus;
