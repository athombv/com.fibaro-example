'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class FibaroSmokeDetectorDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('alarm_smoke', 'SENSOR_ALARM');
    this.registerCapability('alarm_heat', 'SENSOR_ALARM');

    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      if (report) {
        switch (report['Notification Type']) {
          case 'Smoke':
            this.setCapabilityValue('alarm_smoke', report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3);
            break;
          case 'Heat':
            this.setCapabilityValue('alarm_heat', report['Event'] === 1 || report['Event'] === 2 || report['Event'] === 3 || report['Event'] === 4 || report['Event'] === 7);
            break;
          default:
            // Do nothing
        }
      }
    });

    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
    this.registerCapability('measure_battery', 'BATTERY');
  }

}

module.exports = FibaroSmokeDetectorDevice;
