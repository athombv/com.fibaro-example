'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroDoorSensorTwo extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('alarm_contact', 'NOTIFICATION');
    this.registerCapability('alarm_tamper', 'NOTIFICATION');
    this.registerCapability('measure_battery', 'BATTERY');
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
      getOnStart: false,
    });
  }

}

module.exports = FibaroDoorSensorTwo;
