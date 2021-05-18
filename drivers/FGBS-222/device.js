'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroSmartImplant extends ZwaveDevice {

  onNodeInit() {
    // Settings:
    // Input 1 mode
    // Input 2 mode
    // Input 1 Button mode
    // Input 2 Button mode

    // alarm_generic.input1 OR measure_voltage.input1
    // alarm_generic.input2 OR measure_voltage.input2
    // onoff.output1
    // onoff.output2
    // measure_temperature.internal
    // measure_temperature.external1
    // measure_temperature.external2
    // measure_temperature.external3
    // measure_temperature.external4
    // measure_temperature.external5
    // measure_temperature.external6
    // measure_humidty

    // this.enableDebug();
    // this.printNode();

    this.registerMultiChannelReportListener(1, 'NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      const value = !!report['Event'];
      if (value) this.driver.input1OffTrigger.trigger(this);
      else this.driver.input1OnTrigger.trigger(this);
      if (value !== this.getCapabilityValue('alarm_generic.input1')) this.driver.input1SwitchTrigger.trigger(this);

      this.setCapabilityValue('alarm_generic.input1', value);
    });

    this.registerMultiChannelReportListener(2, 'NOTIFICATION', 'NOTIFICATION_REPORT', report => {
      const value = !!report['Event'];
      if (value) this.driver.input2OffTrigger.trigger(this);
      else this.driver.input2OnTrigger.trigger(this);
      if (value !== this.getCapabilityValue('alarm_generic.input2')) this.driver.input2SwitchTrigger.trigger(this);

      this.setCapabilityValue('alarm_generic.input2', value);
    });

    this.registerCapability('measure_voltage.input1', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 3,
      reportParser: report => this.multiChannelAnalogInputParser(report, 3),
    });

    this.registerCapability('measure_voltage.input2', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 4,
      reportParser: report => this.multiChannelAnalogInputParser(report, 4),
    });

    this.registerCapability('onoff.output1', 'SWITCH_BINARY', { multiChannelNodeId: 5 });
    this.registerCapability('onoff.output2', 'SWITCH_BINARY', { multiChannelNodeId: 6 });

    this.registerCapability('measure_temperature.internal', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 7,
      reportParser: report => this.temperatureReportParser(report, 0),
    });

    // External temperature sensor 1
    if (this.node.MultiChannelNodes.hasOwnProperty('8')) {
      this.registerCapability('measure_temperature.external1', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 8,
        reportParser: report => this.temperatureReportParser(report, 1),
      });
    }

    // External temperature sensor 2
    if (this.node.MultiChannelNodes.hasOwnProperty('9')) {
      this.registerCapability('measure_temperature.external2', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 9,
        reportParser: report => this.temperatureReportParser(report, 2),
      });
    }

    // External temperature sensor 3
    if (this.node.MultiChannelNodes.hasOwnProperty('10')) {
      this.registerCapability('measure_temperature.external3', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 10,
        reportParser: report => this.temperatureReportParser(report, 3),
      });
    }

    // External temperature sensor 4
    if (this.node.MultiChannelNodes.hasOwnProperty('11')) {
      this.registerCapability('measure_temperature.external4', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 11,
        reportParser: report => this.temperatureReportParser(report, 4),
      });
    }

    // External temperature sensor 5
    if (this.node.MultiChannelNodes.hasOwnProperty('12')) {
      this.registerCapability('measure_temperature.external5', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 12,
        reportParser: report => this.temperatureReportParser(report, 5),
      });
    }

    // External temperature sensor 6
    if (this.node.MultiChannelNodes.hasOwnProperty('13')) {
      this.registerCapability('measure_temperature.external6', 'SENSOR_MULTILEVEL', {
        multiChannelNodeId: 13,
        reportParser: report => this.temperatureReportParser(report, 6),
      });
    }

    if (this.node.MultiChannelNodes.hasOwnProperty('9')) this.registerCapability('measure_humidty', 'SENSOR_MULTILEVEL', { multiChannelNodeId: 9 });

    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      this.log('CENTRAL_SCENE', report);
    });
  }

  // Settings parser. Not all settings are compatbile with eachother, so check which to save
  async onSettings({oldSettings, newSettings, changedKeys}) {
    // Input parser
    if (changedKeys.includes('20')) {
      if (newSettings['20'] !== '4' || newSettings['20' !== '5']) this.setCapabilityValue('measure_voltage.input1', null); // reset measure voltage
    }

    if (changedKeys.includes('21')) {
      if (newSettings['21'] !== '4' || newSettings['21' !== '5']) this.setCapabilityValue('measure_voltage.input2', null); // reset measure voltage
    }

    // Analog input parser
    // if (changedKeys.includes('63') || changedKeys.includes('64')) {
    // 	if (newSettings['20'] !== '4' || newSettings['20'] !== '5' ||
    // 		newSettings['21'] !== '4' || newSettings['21'] !== '5') {
    // 			return Promise.reject(new Error(Homey.__('errors.input')));
    // 		}
    // }

    return super.onSettings({oldSettings, newSettings, changedKeys});
  }

  temperatureReportParser(report, sensorNumber) {
    let temperatureTrigger;

    switch (sensorNumber) {
      case 0: temperatureTrigger = this.driver.internalTemperatureTrigger; break;
      case 1: temperatureTrigger = this.driver.temperature1Trigger; break;
      case 2: temperatureTrigger = this.driver.temperature2Trigger; break;
      case 3: temperatureTrigger = this.driver.temperature3Trigger; break;
      case 4: temperatureTrigger = this.driver.temperature4Trigger; break;
      case 5: temperatureTrigger = this.driver.temperature5Trigger; break;
      case 6: temperatureTrigger = this.driver.temperature6Trigger; break;
      default: temperatureTrigger = null;
    }

    if (report
      && report.hasOwnProperty('Sensor Type')
      && report['Sensor Type'] === 'Temperature (version 1)'
      && report.hasOwnProperty('Sensor Value (Parsed)')) {
      const token = {
        temp: report['Sensor Value (Parsed)'],
      };

      if (temperatureTrigger) temperatureTrigger.trigger(this, token);

      return report['Sensor Value (Parsed)'];
    }

    return null;
  }

  multiChannelAnalogInputParser(report, multiChannelNodeId) {
    // Removed the input settings check because these multichannelnodes only report
    // when the input is set to analog voltage mode.

    let analogInputFlowTrigger;
    const inputNumber = multiChannelNodeId - 2;

    switch (inputNumber) {
      case 1: analogInputFlowTrigger = this.driver.analogInput1FlowTrigger; break;
      case 2: analogInputFlowTrigger = this.driver.analogInput2FlowTrigger; break;
      default: return 0;
    }

    if (report['Sensor Value (Parsed)']) {
      // Get voltage value from report and trigger the matching Flow
      const voltageValue = Number(report['Sensor Value (Parsed)']);

      analogInputFlowTrigger.trigger(
        this,
        { volt: voltageValue },
      );

      return voltageValue;
    }
    return 0;
  }

}

module.exports = FibaroSmartImplant;
