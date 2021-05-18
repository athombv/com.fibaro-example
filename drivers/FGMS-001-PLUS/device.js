'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroMotionSensorPlus extends ZwaveDevice {

  async onNodeInit() {
    this.registerCapability('alarm_tamper', 'NOTIFICATION');
    this.registerCapability('alarm_motion', 'NOTIFICATION');
    this.registerCapability('measure_luminance', 'SENSOR_MULTILEVEL', {
      getOpts: {
        getOnOnline: true,
      },
    });
    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
      getOpts: {
        getOnOnline: true,
        getOnStart: false,
      },
    });
    this.registerCapability('measure_battery', 'BATTERY');
  }

}

module.exports = FibaroMotionSensorPlus;
