'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroSmokeSensor extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('measure_battery', 'BATTERY');
    this.registerCapability('alarm_smoke', 'SENSOR_ALARM', {
      getOnOnline: true,
    });
    this.registerCapability('alarm_heat', 'SENSOR_ALARM', {
      getOnOnline: true,
    });
    this.registerCapability('alarm_tamper', 'SENSOR_ALARM', {
      getOnOnline: true,
    });
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
  }

}

module.exports = FibaroSmokeSensor;
