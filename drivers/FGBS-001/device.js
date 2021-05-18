'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroUniversalBinarySensor extends ZwaveDevice {

  onNodeInit() {
    /*
        =========================================================================
         Initializing Flow triggers/conditions/actions
        =========================================================================
         */
    this._onTrigger = this.driver.onTrigger;
    this._offTrigger = this.driver.offTrigger;
    this._switchTrigger = this.driver.switchTrigger;

    this._onTrigger2 = this.driver.onTrigger2;
    this._offTrigger2 = this.driver.offTrigger2;
    this._switchTrigger2 = this.driver.switchTrigger2;

    this._temperatureTrigger = this.driver.temperatureTrigger;
    this._temperatureTrigger2 = this.driver.temperatureTrigger2;
    this._temperatureTrigger3 = this.driver.temperatureTrigger3;
    this._temperatureTrigger4 = this.driver.temperatureTrigger4;

    /*
    	=========================================================================
         Multichannel report listeners for binary reports (generic_alarm)
    	=========================================================================
         */

    // Register capability to get value during boot
    this.registerCapability('alarm_generic.contact1', 'BASIC', {
      multiChannelNodeId: 1,
      get: 'BASIC_GET',
      getOpts: {
        getOnStart: true,
      },
      report: 'BASIC_REPORT',
      reportParser: report => {
        if (report && report.hasOwnProperty('Value')) {
          return report['Value'] > 0;
        }
        return null;
      },
    });

    // Listen for input changes
    this.registerMultiChannelReportListener(1, 'BASIC', 'BASIC_SET', report => {
      const result = report.Value > 0;

      this._switchTrigger.trigger(this, null, this.device_data);

      if (result)	this._onTrigger.trigger(this, null, this.device_data);
      else this._offTrigger.trigger(this, null, this.device_data);

      this.setCapabilityValue('alarm_generic.contact1', result);
      return result;
    });

    // Register capability to get value during boot
    this.registerCapability('alarm_generic.contact1', 'BASIC', {
      multiChannelNodeId: 2,
      get: 'BASIC_GET',
      getOpts: {
        getOnStart: true,
      },
      report: 'BASIC_REPORT',
      reportParser: report => {
        if (report && report.hasOwnProperty('Value')) {
          return report['Value'] > 0;
        }
        return null;
      },
    });

    // Listen for input changes
    this.registerMultiChannelReportListener(2, 'BASIC', 'BASIC_SET', report => {
      const result = report.Value > 0;

      this._switchTrigger2.trigger(this, null, this.device_data);

      if (result)	this._onTrigger2.trigger(this, null, this.device_data);
      else this._offTrigger2.trigger(this, null, this.device_data);

      this.setCapabilityValue('alarm_generic.contact2', result);
      return result;
    });

    /*
    	=========================================================================
         Mapping measure_temperature capabilities to sensor multilevel commands
    	=========================================================================
         */
    if (this.node.MultiChannelNodes['3']) {
      this.registerCapability('measure_temperature.sensor1', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 3,
        get: 'SENSOR_MULTILEVEL_GET',
        getOpts: {
          getOnStart: true,
        },
        getParser: () => ({
          'Sensor Type': 'Temperature (version 1)',
          Properties1: {
            Scale: 0,
          },
        }),
        report: 'SENSOR_MULTILEVEL_REPORT',
        reportParser: report => this._temperatureReportParser(report, 1),
      });
    }

    if (this.node.MultiChannelNodes['4']) {
      this.registerCapability('measure_temperature.sensor2', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 4,
        get: 'SENSOR_MULTILEVEL_GET',
        getOpts: {
          getOnStart: true,
        },
        getParser: () => ({
          'Sensor Type': 'Temperature (version 1)',
          Properties1: {
            Scale: 0,
          },
        }),
        report: 'SENSOR_MULTILEVEL_REPORT',
        reportParser: report => this._temperatureReportParser(report, 2),
      });
    }

    if (this.node.MultiChannelNodes['5']) {
      this.registerCapability('measure_temperature.sensor3', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 5,
        get: 'SENSOR_MULTILEVEL_GET',
        getOpts: {
          getOnStart: true,
        },
        getParser: () => ({
          'Sensor Type': 'Temperature (version 1)',
          Properties1: {
            Scale: 0,
          },
        }),
        report: 'SENSOR_MULTILEVEL_REPORT',
        reportParser: report => this._temperatureReportParser(report, 3),
      });
    }

    if (this.node.MultiChannelNodes['6']) {
      this.registerCapability('measure_temperature.sensor4', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 6,
        get: 'SENSOR_MULTILEVEL_GET',
        getOpts: {
          getOnStart: true,
        },
        getParser: () => ({
          'Sensor Type': 'Temperature (version 1)',
          Properties1: {
            Scale: 0,
          },
        }),
        report: 'SENSOR_MULTILEVEL_REPORT',
        reportParser: report => this._temperatureReportParser(report, 4),
      });
    }

    this.registerSetting('12', newValue => new Buffer([Math.round(newValue / 16 * 255)]));
  }

  _temperatureReportParser(report, sensorNumber) {
    let temperatureTrigger;

    switch (sensorNumber) {
      case 1: temperatureTrigger = this._temperatureTrigger; break;
      case 2: temperatureTrigger = this._temperatureTrigger2; break;
      case 3: temperatureTrigger = this._temperatureTrigger3; break;
      case 4: temperatureTrigger = this._temperatureTrigger4; break;
    }

    if (report
			&& report.hasOwnProperty('Sensor Type')
			&& report['Sensor Type'] === 'Temperature (version 1)'
			&& report.hasOwnProperty('Sensor Value (Parsed)')) {
      const token = {
        temp: report['Sensor Value (Parsed)'],
      };

      temperatureTrigger.trigger(this, token, this.device_data);

      return report['Sensor Value (Parsed)'];
    }

    return null;
  }

}

module.exports = FibaroUniversalBinarySensor;
