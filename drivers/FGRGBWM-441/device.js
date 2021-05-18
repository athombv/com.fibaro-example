'use strict';

const {ZwaveDevice, Util} = require('homey-zwavedriver');

const tinyGradient = require('tinygradient');

const multiChannelNodeToColorMap = {
  red: 2,
  green: 3,
  blue: 4,
  white: 5,
};

class FibaroRGBWControllerDevice extends ZwaveDevice {

  onNodeInit() {
    // Color gradient for color_temperature
    this.temperatureGradient = tinyGradient([
      '#80c5fc',
      '#ffffff',
      '#ffe68b',
    ]);

    // Color 'master', should always match with Homey's capabiliy values
    this.currentHSV = {
      hue: this.getCapabilityValue('light_hue'),
      saturation: this.getCapabilityValue('light_saturation'),
      value: this.getCapabilityValue('dim'),
    };

    // Used to calculate the report RGB values back to HSV for capability values.
    this.currentRGB = Util.convertHSVToRGB(this.currentHSV);
    this.stripType = this.getSetting('strip_type');

    // Check on which mode the controller is configured, then set the capability corresponding
    if (this.stripType === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
      this.setCapabilityValue('light_mode', 'temperature');
    } else if (this.getCapabilityValue('light_mode') !== 'color') {
      this.setCapabilityValue('light_mode', 'color');
    }

    // Register capabilities & command classes
    this.registerCapability('onoff', 'SWITCH_MULTILEVEL', { multiChannelNodeId: 1 });
    this.registerCapability('dim', 'SWITCH_MULTILEVEL');

    this.registerMultipleCapabilityListener(['light_saturation', 'light_hue'], async (newValues, opts) => {
      if (typeof newValues.light_hue === 'number') this.currentHSV.hue = newValues.light_hue;
      if (typeof newValues.light_saturation === 'number') this.currentHSV.saturation = newValues.light_saturation;
      this.currentHSV.value = this.getCapabilityValue('dim');

      const rgbColors = Util.convertHSVToRGB(this.currentHSV);
      rgbColors.white = 0;
      this.sendColors(rgbColors);
    });

    this.registerCapabilityListener('light_temperature', async (value, opts) => {
      const colorTempValues = {
        blue: Math.round((1 - value) * 255 * this.getCapabilityValue('dim')), // In temperature mode mix in blue to imitate cool white mode
        red: 0, // Set red to zero since we don't want colors
        green: 0, // Set red to zero since we don't want colors
        white: Math.round(255 * this.getCapabilityValue('dim')),
      };

      if (this.stripType === 'cct' || this.stripType === 'rgbw') {
        this.sendColors(colorTempValues);
      } else return new Error('temperature_mode_not_supported');
    });

    // Input/ report
    this.registerCapability('measure_voltage.input1', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 2,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelNodeReportParser(report, 2),
    });

    this.registerCapability('measure_voltage.input2', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 3,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelNodeReportParser(report, 3),
    });

    this.registerCapability('measure_voltage.input3', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 4,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelNodeReportParser(report, 4),
    });

    this.registerCapability('measure_voltage.input4', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 5,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this.multiChannelNodeReportParser(report, 5),
    });

    // Power capabilities
    this.registerCapability('meter_power', 'METER');
    this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');

    // Register settings
    this.registerSetting('strip_type', (value, settings) => {
      this.log('New LED strip mode', value);
      if (value === 'cct') this.setCapabilityValue('light_mode', 'temperature');
      else if (value === 'rgb' || value === 'rgbw') this.setCapabilityValue('light_mode', 'color');
      this.stripType = value;
    });

    // Get flows from driver
    this._onFlowTrigger = this.driver.onFlowTrigger;
    this._offFlowTrigger = this.driver.offFlowTrigger;

    this.inputFlowTriggers = {
      1: this.driver.input1FlowTrigger,
      2: this.driver.input2FlowTrigger,
      3: this.driver.input3FlowTrigger,
      4: this.driver.input4FlowTrigger,
    };

    this._specificColorAction = this.driver.specificColorAction;
    this._animationAction = this.driver.animationAction;
  }

  // Flow methods
  async specificColorRunListener(args, state) {
    // Unfortunately the old flow args used r,g,b,w instead of red, green, blue, white
    // because of this, the colorname has to be parsed
    if (!args.hasOwnProperty('color') && !args.hasOwnProperty('brightness')) return new Error('invalid_args');
    if (typeof args.brightness !== 'number') return false;
    args.brightness = Math.round(args.brightness * 100);

    if (args.color === 'r') return this.sendColors({ red: args.brightness * 2.55 });
    if (args.color === 'g') return this.sendColors({ green: args.brightness * 2.55 });
    if (args.color === 'b') return this.sendColors({ blue: args.brightness * 2.55 });
    if (args.color === 'w') return this.sendColors({ white: args.brightness * 2.55 });
  }

  async animationRunListener(args, state) {
    if (!this.stripType.includes('rgb')) return Promise.reject('Animations only available in RGB(W) mode');

    if (args && args.hasOwnProperty('animation')) {
      this.log('Setting animation to', args.animation);
      if (args.animation === '0') return this.sendColors(Util.convertHSVToRGB(this.currentHSV));
      if (args.animation === '11') args.animation = Math.round(Math.random() * (10 - 6) + 6);

      try {
        return await this.configurationSet({
          index: 72,
          size: 1,
        }, new Buffer([parseInt(args.animation)]));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }

  multiChannelNodeReportParser(report, multiChannelNodeId) {
    // Determine if the report contains a color value or a voltage value.
    this.log('Report for multiChannelNode', multiChannelNodeId);
    const inputNumber = multiChannelNodeId - 1;
    if (this.getSetting(`input_config_${inputNumber}`) === '8') {
      // The report has a value of 0-99, 100 levels. 0-10V input, so divide by 10.
      const voltageValue = Math.round((report['Value (Raw)'].readUIntBE(0, 1) / 99) * 10);
      this.log('Voltage mode', voltageValue);

      this.inputFlowTriggers[inputNumber].trigger(this, null), { volt: voltageValue };

      return voltageValue;
    }
    this.log('Color report received');
    // Get the associated color channel from the multichannelnode number
    const color = Object.keys(multiChannelNodeToColorMap).find(key => {
      return multiChannelNodeToColorMap[key] === multiChannelNodeId;
    });

    this.currentRGB[color] = Math.round((report['Value (Raw)'].readUIntBE(0, 1) / 99) * 255);
    const tempHSV = Util.convertRGBToHSV(this.currentRGB);

    // overwrite tempHSV.value for dim level when lightmode is temperature
    if (typeof this.currentRGB['white'] !== 'undefined' && this.currentRGB['white'] > 0) {
      tempHSV.value = this.currentRGB['white'] / 255;
    }

    // Debounce timeout to prevent glitches in the Homey UI.
    if (this.colorChangeReportTimeout) clearTimeout(this.colorChangeReportTimeout);
    this.colorChangeReportTimeout = setTimeout(() => {
      this.log('Setting colors from report to', tempHSV);
      this.setCapabilityValue('light_hue', tempHSV.hue);
      this.setCapabilityValue('light_saturation', tempHSV.saturation);
      this.setCapabilityValue('dim', tempHSV.value);
    }, 2000);

    return 0;
  }

  /**
     * Function to send a object with color values to the correct multichannel node
     * The multichannelnodes are defined in the const multiChannelNodeToColorMap
     * @param {Object} colorObject Object with the color values to send, values in range 0-255.
     */
  async sendColors(colorObject) {
    if (!colorObject) return;

    Object.keys(colorObject).forEach(async key => {
      this.log(`Sending value: ${colorObject[key]} to node: ${multiChannelNodeToColorMap[key]}`);
      // Get the node matching with the color, then send the color value divided by 2.55 (0-99 range)
      await this.node.MultiChannelNodes[multiChannelNodeToColorMap[key]].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({ Value: Math.round((colorObject[key] / 255) * 99) });
    });
    return true;
  }

}

module.exports = FibaroRGBWControllerDevice;
