'use strict';

const {ZwaveLightDevice} = require('homey-zwavedriver');

class FibaroRGBW2Device extends ZwaveLightDevice {

  async onNodeInit() {
    // Init for ZWave light device which handles RGBW
    await super.onNodeInit();

    // Power capabilities
    this.registerCapability('meter_power', 'METER');
    this.registerCapability('measure_power', 'METER');

    // Input/ report
    this.registerCapability('measure_voltage.input1', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 6,
          	get: 'SENSOR_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SENSOR_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelAnalogInputParser(report, 6),
    });

    this.registerCapability('measure_voltage.input2', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 7,
          	get: 'SENSOR_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SENSOR_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelAnalogInputParser(report, 7),
    });

    this.registerCapability('measure_voltage.input3', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 8,
          	get: 'SENSOR_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SENSOR_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelAnalogInputParser(report, 8),
    });

    this.registerCapability('measure_voltage.input4', 'SENSOR_MULTILEVEL', {
      multiChannelNodeId: 9,
          	get: 'SENSOR_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SENSOR_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelAnalogInputParser(report, 9),
    });

    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      this.log('Scene report', report);
    });
  }

  multiChannelAnalogInputParser(report, multiChannelNodeId) {
    const inputNumber = multiChannelNodeId - 5;
    const inputConfig = this.getSetting(`input_config_${inputNumber}`);

    if ((inputConfig === '0' || inputConfig === '1') && report.hasOwnProperty('Sensor Value (Parsed)')) {
      // Get voltage value from report and trigger the matching Flow
      const voltageValue = Number(report['Sensor Value (Parsed)']);

      this.driver.analogInputFlowTrigger.trigger(
        this,
        { input: inputNumber },
        { volt: voltageValue },
      );

      return voltageValue;
    }
    return 0;
  }

  // Overrride _sendColor from base class to work with 4 colors rather then 5
  async _sendColors({
    warm, cold, red, green, blue, duration,
  }) {
    const SwitchColorVersion = this.getCommandClass('SWITCH_COLOR').version || 1;

    // Work arround the missing cold functionality by mixing blue as cold.
    if (cold > 125) {
      blue = cold;
      warm = cold / 2;
    } else if (cold > 0) {
      blue = cold;
    }

    let setCommand = {
      Properties1: {
        'Color Component Count': 4,
      },
      vg1: [
        {
          'Color Component ID': 0,
          Value: Math.round(warm),
        },
        {
          'Color Component ID': 2,
          Value: Math.round(red),
        },
        {
          'Color Component ID': 3,
          Value: Math.round(green),
        },
        {
          'Color Component ID': 4,
          Value: Math.round(blue),
        },
      ],
    };

    if (SwitchColorVersion === 3) {
      setCommand = new Buffer([setCommand.Properties1['Color Component Count'], 0, setCommand.vg1[0].Value, 2, setCommand.vg1[1].Value, 3, setCommand.vg1[2].Value, 4, setCommand.vg1[3].Value], 255);
    } else if (SwitchColorVersion > 1) {
      setCommand.Duration = typeof duration !== 'number' ? FACTORY_DEFAULT_COLOR_DURATION : Utils.calculateZwaveDimDuration(duration);
    }

    return this.node.CommandClass.COMMAND_CLASS_SWITCH_COLOR.SWITCH_COLOR_SET(setCommand);
  }

  async animationRunListener(args, state) {
    if (args && args.hasOwnProperty('animation')) {
      this.log('Setting animation to', args.animation);
      if (args.animation === '11') args.animation = Math.round(Math.random() * (10 - 6) + 6);

      try {
        return await this.configurationSet({
          index: 157,
          size: 1,
        }, new Buffer([parseInt(args.animation)]));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }

}

module.exports = FibaroRGBW2Device;
