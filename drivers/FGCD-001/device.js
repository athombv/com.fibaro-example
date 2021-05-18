'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

const TEST_TIMEOUT = 30 * 1000;

class FibaroCODetectorDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('alarm_co', 'NOTIFICATION');
    this.registerCapability('alarm_heat', 'NOTIFICATION');

    this.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      if (report) {
        switch (report['Notification Type']) {
          case 'CO':
            this.setCapabilityValue('alarm_co', true);
            if (this.testTimeout) clearTimeout(this.testTimeout);
            this.testTimeout = setTimeout(() => {
              this.setCapabilityValue('alarm_co', false);
            }, TEST_TIMEOUT);
            break;
          default:
            // Do nothing
        }
      }
    });

    // this.registerReportListener('alarm_co', 'NOTIFICATION', report => {
    //   if (report && report['Notification Type'] === 'CO'
    //     && report.hasOwnProperty('Event (Parsed)')
    //     && report['Event (Parsed)'].includes('Test')
    //   ) {
    //     if (this.testTimeout) clearTimeout(this.testTimeout);
    //     this.testTimeout = setTimeout(() => {
    //       this.setCapabilityValue('alarm_co', false);
    //     }, TEST_TIMEOUT);
    //   }
    // });

    this.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
    this.registerCapability('measure_battery', 'BATTERY');
  }

}

module.exports = FibaroCODetectorDevice;
