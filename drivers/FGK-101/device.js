'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroDoorSensor extends ZwaveDevice {

  async onNodeInit() {
    this.registerCapability('alarm_contact', 'BASIC', {
      getOpts: {
        getOnOnline: true,
      },
    });
    this.registerCapability('alarm_tamper', 'SENSOR_ALARM', {
      getOpts: {
        getOnOnline: true,
      },
    });
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 2,
      getOnStart: false,
    });
    this.registerCapability('measure_battery', 'BATTERY');
  }

}

module.exports = FibaroDoorSensor;
