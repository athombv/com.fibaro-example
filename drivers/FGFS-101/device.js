'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

const TAMPER_TIMEOUT = 30 * 1000;

class FibaroFloodSensor extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('alarm_water', 'SENSOR_ALARM');

    this.setCapabilityValue('alarm_tamper', false);
    this.registerReportListener('SENSOR_ALARM', 'SENSOR_ALARM_REPORT', report => {
      if (!report || !report.hasOwnProperty('Sensor Type') || !report.hasOwnProperty('Sensor State')) return null;

      if (report['Sensor Type'] === 'General Purpose Alarm' && report['Sensor State'] === 'alarm') {
        this.setCapabilityValue('alarm_tamper', true);
        if (this.tamperTimeout) clearTimeout(this.tamperTimeout);
        this.tamperTimeout = setTimeout(() => {
          this.setCapabilityValue('alarm_tamper', false);
        }, TAMPER_TIMEOUT);
      }
    });

    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 2,
    });
    this.registerCapability('measure_battery', 'BATTERY');

    this.registerSetting('temperature_measure_hysteresis', value => value * 10);
    this.registerSetting('temperature_measure_offset', value => value * 100);
    this.registerSetting('low_temperature_threshold', value => value * 100);
    this.registerSetting('high_temperature_threshold', value => value * 100);
  }

}

module.exports = FibaroFloodSensor;
