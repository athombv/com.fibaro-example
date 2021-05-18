'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroMotionSensor extends ZwaveDevice {

  async onNodeInit() {
    this.registerCapability('alarm_tamper', 'SENSOR_ALARM', {
      getOpts: {
        getOnOnline: true,
      },
    });
    this.registerCapability('alarm_motion', 'SENSOR_BINARY', {
      getOpts: {
        getOnOnline: true,
      },
    });
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

module.exports = FibaroMotionSensor;
