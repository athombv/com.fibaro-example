'use strict';

// Athom includes
const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');
const utils = require('homey-zwavedriver').Util;

// Third party includes
const tinyGradient = require('tinygradient');

class FibaroRGBWControllerDevice extends ZwaveDevice {

  onMeshInit() {
    this.currentRGB = {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    };
    this.currentHSV = {
      h: 0,
      s: 0,
      v: 0,
    };
    this.realInputConfigs = {
      input1: null,
      input2: null,
      input3: null,
      input4: null,
    };
    this.temperatureGradient = tinyGradient([
      '#80c5fc',
      '#ffffff',
      '#ffe68b',
    ]);

    if (this.getSetting('strip_type') === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
      this.setCapabilityValue('light_mode', 'temperature');
    } else if (this.getCapabilityValue('light_mode') !== 'color') {
      this.setCapabilityValue('light_mode', 'color');
    }

    this._reloadRealInputConfig();

    /*
        ================================================================
        Registering Flows
        ================================================================
         */
    this._onFlowTrigger = this.driver.onFlowTrigger;
    this._offFlowTrigger = this.driver.offFlowTrigger;

    this._input1FlowTrigger = this.driver.input1FlowTrigger;
    this._input2FlowTrigger = this.driver.input2FlowTrigger;
    this._input3FlowTrigger = this.driver.input3FlowTrigger;
    this._input4FlowTrigger = this.driver.input4FlowTrigger;

    this._resetMeterAction = this.driver.resetMeterAction;

    this._randomColorAction = this.driver.randomColorAction;
    this._specificColorAction = this.driver.specificColorAction;
    this._animationAction = this.driver.animationAction;

    /*
        ================================================================
        Registering on/off and dim
        ================================================================
        */
    this.registerCapability('onoff', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 1,
    });


    this.registerCapability('dim', 'SWITCH_MULTILEVEL');

    /*
        ================================================================
        Registering light_hue and light_saturation
        ================================================================
        */
    this.registerMultipleCapabilityListener(['light_saturation', 'light_hue'], async (newValues, opts) => {
      this.log('===============================================================================');
      this.log('HUE OR SATURATION CHANGED, SENDING VALUES');
      this.log('===============================================================================');
      if (this.getSetting('strip_type') === 'cct') return Promise.reject('no_color_for_cct');
      let red;
      let green;
      let blue;
      let white;

      if (typeof newValues.light_hue === 'number') this.currentHSV.h = newValues.light_hue;
      if (typeof newValues.light_saturation === 'number') this.currentHSV.s = newValues.light_saturation;

      const hue = (this.currentHSV.h * 360) || 0;
      const saturation = (this.currentHSV.s * 100) || 0;
      const dim = this.getCapabilityValue('dim') * 100;
      const stripType = this.getSetting('strip_type');

      const hsv = { h: hue, s: saturation, v: dim };
      const rgb = this._convertHSVToRGB(hsv);
      const rgbw = this._convertRGBtoRGBW(rgb);

      if (stripType === 'rgbw') {
        red = (rgbw.r / 255) * 99;
        green = (rgbw.g / 255) * 99;
        blue = (rgbw.b / 255) * 99;
        white = (rgbw.w / 255) * 99;
      } else {
        red = (rgb.r / 255) * 99;
        green = (rgb.g / 255) * 99;
        blue = (rgb.b / 255) * 99;
      }

      try {
        this.currentRGB.r = red;
        this.currentRGB.g = green;
        this.currentRGB.b = blue;

        await this._sendColor(red, 2);
        await this._sendColor(green, 3);
        await this._sendColor(blue, 4);

        if (typeof white === 'number') {
          this.currentRGB.a = white;
          await this._sendColor(white, 5);
        }
      } catch (err) {
        this.currentHSV.h = this.getCapabilityValue('light_hue');
        this.currentHSV.s = this.getCapabilityValue('light_saturation');
        this.currentHSV.v = this.getCapabilityValue('dim');

        return Promise.reject(err);
      }

      return Promise.resolve();
    });

    /*
        ================================================================
        Registering light_temperature
        ================================================================
         */
    this.registerCapabilityListener('light_temperature', async (value, opts) => {
      this.log('===============================================================================');
      this.log('COLOUR TEMP CHANGED, SENDING VALUES');
      this.log('===============================================================================');

      let red;
      let green;
      let blue;
      let white;
      const dim = this.getCapabilityValue('dim');
      const stripType = this.getSetting('strip_type');

      if (stripType === 'cct') {
        red = 0;
        green = 0;
        blue = Math.round(dim * (1 - value) * 99);
        white = Math.round(dim * value * 99);
      } else {
        const HSV = this.temperatureGradient.hsvAt(value).toHsv();
        HSV.s *= 100;
        HSV.v = dim * 100;

        if (stripType === 'rgbw') {
          const rgbw = this._convertRGBtoRGBW(rgb);
          red = (rgbw.r / 255) * 99;
          green = (rgbw.g / 255) * 99;
          blue = (rgbw.b / 255) * 99;
          white = (rgbw.w / 255) * 99;
        } else {
          const rgb = this._convertHSVToRGB(HSV);
          red = (rgb.r / 255) * 99;
          green = (rgb.g / 255) * 99;
          blue = (rgb.b / 255) * 99;
        }
      }

      try {
        await this._sendColor(red, 2);
        this.currentRGB.r = red;
        await this._sendColor(green, 3);
        this.currentRGB.g = green;
        await this._sendColor(blue, 4);
        this.currentRGB.b = blue;

        if (typeof white === 'number') {
          await this._sendColor(white, 5);
          this.currentRGB.a = white;
        }

        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });

    this.registerCapabilityListener('light_mode', async (value, opts) => {
      this.log('===============================================================================');
      this.log('LIGHT MODE CHANGED, SENDING VALUES');
      this.log('===============================================================================');

      const stripType = this.getSetting('strip_type');

      if (value === 'color') {
        if (stripType === 'cct') return Promise.reject('no_color_for_cct');
        let red;
        let green;
        let blue;
        let white;

        const hue = this.currentHSV.h * 360 || 0;
        const saturation = this.currentHSV.s * 100 || 0;
        const value = this.getCapabilityValue('dim') * 100;
        const rgb = this._convertHSVToRGB({ h: hue, s: saturation, v: value });
        const rgbw = this._convertRGBtoRGBW(rgb);

        if (stripType === 'rgbw') {
          red = (rgbw.r / 255) * 99;
          green = (rgbw.g / 255) * 99;
          blue = (rgbw.b / 255) * 99;
          white = (rgbw.w / 255) * 99;
        } else {
          red = (rgb.r / 255) * 99;
          green = (rgb.g / 255) * 99;
          blue = (rgb.b / 255) * 99;
        }

        try {
          await this._sendColor(red, 2);
          this.currentRGB.r = red;
          await this._sendColor(green, 3);
          this.currentRGB.g = green;
          await this._sendColor(blue, 4);
          this.currentRGB.b = blue;

          if (typeof white === 'number') {
            await this._sendColor(white, 5);
            this.currentRGB.a = white;
          }

          return Promise.resolve();
        } catch (err) {
          return Promise.reject(err);
        }
      } else if (value === 'temperature') {
        let red;
        let green;
        let blue;
        let white;
        const dim = this.getCapabilityValue('dim');
        const temperature = this.getCapabilityValue('light_temperature');

        if (stripType === 'cct') {
          red = 0;
          green = 0;
          blue = Math.round(dim * (1 - temperature) * 99);
          white = Math.round(dim * temperature * 99);
        } else {
          const HSV = this.temperatureGradient.hsvAt(temperature).toHsv();
          HSV.s *= 100;
          HSV.v = dim * 100;

          const rgb = this._convertHSVToRGB(HSV);
          const rgbw = this._convertRGBtoRGBW(rgb);

          if (stripType === 'rgbw') {
            red = (rgbw.r / 255) * 99;
            green = (rgbw.g / 255) * 99;
            blue = (rgbw.b / 255) * 99;
            white = (rgbw.w / 255) * 99;
          } else {
            red = (rgb.r / 255) * 99;
            green = (rgb.g / 255) * 99;
            blue = (rgb.b / 255) * 99;
          }
        }

        try {
          await this._sendColor(red, 2);
          this.currentRGB.r = red;
          await this._sendColor(green, 3);
          this.currentRGB.g = green;
          await this._sendColor(blue, 4);
          this.currentRGB.b = blue;

          if (typeof white === 'number') {
            await this._sendColor(white, 5);
            this.currentRGB.a = white;
          }

          return Promise.resolve();
        } catch (err) {
          return Promise.reject(err);
        }
      }
    });

    /*
        ================================================================
        Registering meter_power and measure_power
        ================================================================
         */
    this.registerCapability('meter_power', 'METER');
    this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');

    /*
        ================================================================
        Registering measure_voltage.input
        ================================================================
         */
    this.registerCapability('measure_voltage.input1', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 2,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this._reportParser(report, 2),
    });
    this.registerCapability('measure_voltage.input2', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 3,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this._reportParser(report, 3),
    });
    this.registerCapability('measure_voltage.input3', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 4,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this._reportParser(report, 4),
    });
    this.registerCapability('measure_voltage.input4', 'SWITCH_MULTILEVEL', {
      multiChannelNodeId: 5,
          	get: 'SWITCH_MULTILEVEL_GET',
          	getOpts: {
          		getOnStart: true,
          	},
      report: 'SWITCH_MULTILEVEL_REPORT',
      reportParser: report => this._reportParser(report, 5),
    });

    /*
        ================================================================
        Registering settings with custom parsers
        ================================================================
         */
    this.registerSetting('strip_type', (value, settings) => {
      if (value === 'cct' && this.getCapabilityValue('light_mode') !== 'temperature') {
        this.setCapabilityValue('light_mode', 'temperature');
      } else if (this.getCapabilityValue('light_mode') !== 'color') {
        this.setCapabilityValue('light_mode', 'color');
      }

      if (this._reloadRealInputConfig()) {
        return new Buffer([
          this.realInputConfigs.input1 * 16 + this.realInputConfigs.input2,
          this.realInputConfigs.input3 * 16 + this.realInputConfigs.input4,
        ]);
      }
    });
    // Both connected to the same index
    this.registerSetting('mode2_range', (value, settings) => {
      if (zwaveObj.mode2_transition_time === '0') return 0;
      return new Buffer([value + zwaveObj.mode2_transition_time]);
    });
    this.registerSetting('mode2_transition_time', (value, settings) => {
      if (value === '0') return 0;
      return new Buffer([value + zwaveObj.mode2_transition_time]);
    });
    // Handles Z-Wave sending in parser method as multiple inputs end up at the same index
    this.registerSetting('input_config_1', (value, settings) => this._inputSettingParser(1, value, settings));
    this.registerSetting('input_config_2', (value, settings) => this._inputSettingParser(2, value, settings));
    this.registerSetting('input_config_3', (value, settings) => this._inputSettingParser(3, value, settings));
    this.registerSetting('input_config_4', (value, settings) => this._inputSettingParser(4, value, settings));
    this.registerSetting('input_threshold', value => new Buffer([value * 10]));
    this.registerSetting('kwh_threshold', value => new Buffer([value * 100]));
  }

  /*
    Conversion methods
     */

  /**
     * Converts HSV values to RGB
     * @param h the hue between 0 - 360
     * @param s the saturation between 0 - 100
     * @param v the value between 0 - 100
     * @returns RGB Red, Green and Blue values between 0 - 255
     * @private
     */
  _convertHSVToRGB({ h, s, v }) {
    this.log('== HSV TO RGB ===================================================================');
    this.log(`Input values: h:${h}, s:${s}, v:${v}`);

    // Normalise hue, saturation and value
    const workingHue = h / 60;
    const workingSat = s / 100;
    const workingVal = v / 100;

    this.log('================================================================================');
    this.log(`Normalized input values: h:${workingHue}, s:${workingSat}, v:${workingVal}`);

    // Calculate the in between products needed for RGB conversion
    const chroma = workingVal * workingSat;
    const X = chroma * (1 - Math.abs(workingHue % 2 - 1));
    const m = workingVal - chroma;

    let tempRGB;

    // Depending on the hue assign RGB values
    if (workingHue >= 0 && workingHue < 1) tempRGB = { r: chroma, g: X, b: 0 };
    if (workingHue >= 1 && workingHue < 2) tempRGB = { r: X, g: chroma, b: 0 };
    if (workingHue >= 2 && workingHue < 3) tempRGB = { r: 0, g: chroma, b: X };
    if (workingHue >= 3 && workingHue < 4) tempRGB = { r: 0, g: X, b: chroma };
    if (workingHue >= 4 && workingHue < 5) tempRGB = { r: X, g: 0, b: chroma };
    if (workingHue >= 5 && workingHue < 6) tempRGB = { r: chroma, g: 0, b: X };

    // Return values to 0 - 255 value space
    const rgb = {};
    rgb.r = Math.round((tempRGB.r + m) * 255);
    rgb.g = Math.round((tempRGB.g + m) * 255);
    rgb.b = Math.round((tempRGB.b + m) * 255);

    this.log('================================================================================');
    this.log(`Output values: R:${rgb.r}, G:${rgb.g}, B:${rgb.b}`);
    this.log('================================================================================\n\n');
    return rgb;
  }

  /**
     * Converts RGB values to HSV values
     * @param r the value for the red channel between 0 - 255
     * @param g the value for the green channel between 0 - 255
     * @param b the value for the blue channel between 0 - 255
     * @returns {Object} Hue between 0 - 360, saturation between 0 - 100, value between 0 - 100
     * @private
     */
  _convertRGBToHSV({ r, g, b }) {
    this.log('== RGB TO HSV ===================================================================');
    this.log(`Input values: r:${r}, g:${g}, b:${b}`);

    const normalized = this.normalizeRGBValues({ r, g, b });

    this.log('================================================================================');
    this.log(`Normalized input values: r:${normalized.r}, g:${normalized.g}, b:${normalized.b}`);

    // Determine the minimum and maximum value between R, G, B
    const colorMin = Math.min(normalized.r, normalized.g, normalized.b);
    const colorMax = Math.max(normalized.r, normalized.g, normalized.b);
    const colorDelta = colorMax - colorMin;

    const HSV = {};

    // Calculate the hue based on which colour has the highest intensity
    if (colorDelta === 0) HSV.h = 0;
    else if (colorMax === normalized.r) {
      HSV.h = this.calculateHue(normalized.g, normalized.b, colorDelta, 0);
    } else if (colorMax === normalized.g) {
      HSV.h = this.calculateHue(normalized.b, normalized.r, colorDelta, 120);
    } else if (colorMax === normalized.b) {
      HSV.h = this.calculateHue(normalized.r, normalized.g, colorDelta, 240);
    }

    colorMax === 0 ? HSV.s = 0 : HSV.s = (colorDelta / colorMax) * 100;
    HSV.v = colorMax * 100;

    this.log('================================================================================');
    this.log(`Output values: H:${HSV.h}, S:${HSV.s}, V:${HSV.v}`);
    this.log('================================================================================\n\n');
    return HSV;
  }

  /**
     * Converts RGB colors to RGBW colors
     * @param r the value for the red channel between 0 - 255
     * @param g the value for the green channel between 0 - 255
     * @param b the value for the blue channel between 0 - 255
     * @returns {Object} Red, Green, Blue and White values between 0 - 255
     * @private
     */
  _convertRGBtoRGBW({ r, g, b }) {
    this.log('== RBB TO RGBW ===================================================================');
    this.log(`Input values: r:${r}, g:${g}, b:${b}`);

    const normalized = this.normalizeRGBValues({ r, g, b });

    this.log('================================================================================');
    this.log(`Normalized input values: r:${normalized.r}, g:${normalized.g}, b:${normalized.b}`);

    const colorMax = Math.max(normalized.r, normalized.g, normalized.b);
    if (colorMax === 0) {
      return {
        r, g, b, w: 0,
      };
    }

    const multiplier = 1 / colorMax;

    const hueRed = normalized.r * multiplier;
    const hueGreen = normalized.g * multiplier;
    const hueBlue = normalized.b * multiplier;

    const maxHue = Math.max(hueRed, hueGreen, hueBlue);
    const minHue = Math.min(hueRed, hueGreen, hueBlue);

    const normalizedW = ((maxHue + minHue) / 2 - 0.5) * 2 / multiplier;

    this.log('================================================================================');
    this.log(`Normalized output values: r:${normalized.r}, g:${normalized.g}, b:${normalized.b}, w:${normalizedW}`);
    let white = normalizedW * 255;
    let red = (normalized.r - normalizedW) * 255;
    let green = (normalized.g - normalizedW) * 255;
    let blue = (normalized.b - normalizedW) * 255;

    red = this._toRGBSpace(red);
    green = this._toRGBSpace(green);
    blue = this._toRGBSpace(blue);
    white = this._toRGBSpace(white);

    this.log('================================================================================');
    this.log(`Output values: r:${red}, g:${green}, b:${blue}, w:${white}`);
    this.log('================================================================================\n\n');
    return {
      r: red, g: green, b: blue, w: white,
    };
  }

  /**
     * Normalizes RGB values from 0 - 255 to 0 - 1
     * @param r the value for the red channel between 0 - 255
     * @param g the value for the green channel between 0 - 255
     * @param b the value for the blue channel between 0 - 255
     * @returns {Object} Red, green and blue values between 0 - 1
     */
  normalizeRGBValues({ r, g, b }) {
    return { r: r / 255, g: g / 255, b: b / 255 };
  }

  /**
     * Calculates the hue value given the products to do so
     * @param segment1 Base for the segment calculation
     * @param segment2 Number to be substracted from the segment base
     * @param colorDelta The delta between brightest and lowest colour
     * @param baseDegrees The base segment degrees
     * @returns {Number} The hue calculated with the input
     */
  calculateHue(segment1, segment2, colorDelta, baseDegrees) {
    const segment = (segment1 - segment2) / colorDelta;
    // 0 degrees for red hue, divided by 360 / 6
    let shift = baseDegrees / 60;
    if (segment < 0) shift = 360 / 60;
    return (segment + shift) * 60;
  }

  /**
     * Limits a value between 0 - 255
     * @param number The number to limit
     * @returns {Number} A number within range 0 - 255
     * @private
     */
  _toRGBSpace(number) {
    return number > 255 ? 255 : number < 0 ? 0 : number;
  }

  /*
    ================================================================
    Flow related methods
    ================================================================
     */
  onOffFlowRunListener(args, state) {
    if (args && args.hasOwnProperty('input')
            && state && state.hasOwnProperty('input')
            && args.input === state.input) {
      return true;
    }
    return false;
  }

  resetMeterRunListener(args, state) {
    if (this.node && typeof this.node.CommandClass.COMMAND_CLASS_METER !== 'undefined') {
      this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
        if (err) return new Error(err);
        if (result === 'TRANSMIT_COMPLETE_OK') return true;
        return false;
      });
    }
  }

  async randomColorRunListener(args, state) {
    if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Random colors only available in RGB(W) mode');
    if (args.hasOwnProperty('range')) {
      const dim = this.getCapabilityValue('dim');
      const stripType = this.getSetting('strip_type');
      let rgb = this._convertHSVToRGB({
        h: Math.round(Math.random() * 360),
        s: 100,
        v: dim * 100,
      });
      let rgbw = this._convertRGBtoRGBW(rgb);

      // Adjust color values to 0 - 100 scale
      rgbw.red = (rgbw.r / 255) * 99;
      rgbw.green = (rgbw.g / 255) * 99;
      rgbw.blue = (rgbw.b / 255) * 99;
      rgbw.white = (rgbw.w / 255) * 99;

      rgb.red = (rgb.r / 255) * 99;
      rgb.green = (rgb.g / 255) * 99;
      rgb.blue = (rgb.b / 255) * 99;

      try {
        if (args.range === 'rgb') {
          await this._sendColor(rgb.red, 2);
          await this._sendColor(rgb.green, 3);
          await this._sendColor(rgb.blue, 4);
        } else if (args.range === 'rgbw' && stripType === 'rgbw') {
          await this._sendColor(rgbw.red, 2);
          await this._sendColor(rgbw.green, 3);
          await this._sendColor(rgbw.blue, 4);
          await this._sendColor(rgbw.white, 5);
        } else if (args.range === 'rgb-w' && stripType === 'rgbw') {
          const randomDecision = Math.round(Math.random());

          if (randomDecision !== 0) {
            await this._sendColor(0, 2);
            await this._sendColor(0, 3);
            await this._sendColor(0, 4);
            await this._sendColor(rgbw.white, 5);
          } else {
            await this._sendColor(rgb.red, 2);
            await this._sendColor(rgb.green, 3);
            await this._sendColor(rgb.blue, 4);
          }
        } else if (args.range.indexOf('r-g-b') >= 0) {
          let option;

          args.range.indexOf('w') >= 0 ? option = Math.round(Math.random() * 4) : option = Math.round(Math.random() * 3);

          switch (option) {
            case 0:
              rgb.red = 99 * dim;
              await this._sendColor(rgb.red, 2);
              await this._sendColor(0, 3);
              await this._sendColor(0, 4);
              await this._sendColor(0, 5);
              break;
            case 1:
              rgb.green = 99 * dim;
              await this._sendColor(0, 2);
              await this._sendColor(rgb.green, 3);
              await this._sendColor(0, 4);
              await this._sendColor(0, 5);
              break;
            case 2:
              rgb.blue = 99 * dim;
              await this._sendColor(0, 2);
              await this._sendColor(0, 3);
              await this._sendColor(rgb.blue, 4);
              await this._sendColor(0, 5);
              break;
            case 3:
              rgbw.white = 99 * dim;
              await this._sendColor(0, 2);
              await this._sendColor(0, 3);
              await this._sendColor(0, 4);
              await this._sendColor(rgbw.white, 5);
              break;
          }
        } else if (args.range.indexOf('r-y-g-c-b-m') >= 0) {
          let option;
          let hue;

          args.range.indexOf('w') >= 0 ? option = Math.round(Math.random() * 7) : option = Math.round(Math.random() * 6);

          switch (option) {
            case 0:
              rgb.red = 99 * dim;
              await this._sendColor(rgb.red, 2);
              await this._sendColor(0, 3);
              await this._sendColor(0, 4);
              await this._sendColor(0, 5);
              break;
            case 1:
              hue = 0.125;
              break;
            case 2:
              rgb.green = 99 * dim;
              await this._sendColor(0, 2);
              await this._sendColor(rgb.green, 3);
              await this._sendColor(0, 4);
              await this._sendColor(0, 5);
              break;
            case 3:
              hue = 0.5;
              break;
            case 4:
              rgb.blue = 99 * dim;
              await this._sendColor(0, 2);
              await this._sendColor(0, 3);
              await this._sendColor(rgb.blue, 4);
              await this._sendColor(0, 5);
              break;
            case 5:
              hue = 0.875;
              break;
            case 6:
              rgbw.white = 99 * dim;
              await this._sendColor(0, 2);
              await this._sendColor(0, 3);
              await this._sendColor(0, 4);
              await this._sendColor(rgbw.white, 5);
              break;
          }

          if (hue) {
            rgb = this._convertHSVToRGB({ h: hue * 360, s: 100, v: dim * 100 });
            rgbw = this._convertRGBtoRGBW(rgb);

            await this._sendColor((rgbw.r / 255) * 99, 2);
            await this._sendColor((rgbw.g / 255) * 99, 3);
            await this._sendColor((rgbw.b / 255) * 99, 4);
            await this._sendColor((rgbw.w / 255) * 99, 5);
          }
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }

  async specificColorRunListener(args, state) {
    if (args && args.hasOwnProperty('color') && args.hasOwnProperty('brightness')) {
      let multiChannel;
      const stripType = this.getSetting('strip_type');

      switch (args.color) {
        case 'r':
          multiChannel = 2;
          break;
        case 'g':
          multiChannel = 3;
          break;
        case 'b':
          multiChannel = 4;
          break;
        case 'w':
          multiChannel = 5;
          break;
      }

      if (stripType.indexOf('sc') >= 0 && args.color !== stripType.slice(2)) return Promise.reject('Color not in use');
      if (stripType.indexOf('cct') >= 0 && (args.color === 'r' || args.color === 'g')) return Promise.reject('Color not in use');
      if (stripType === 'rgb' && args.color === 'w') return Promise.reject('Color not in use');

      return await this._sendColor(Math.round(args.brightness * 99), multiChannel);
    }
  }

  async animationRunListener(args, state) {
    if (this.getSetting('strip_type').indexOf('rgb') < 0) return Promise.reject('Animations only available in RGB(W) mode');
    // if ((this.realInputConfigs.input1 || this.realInputConfigs.input2 || this.realInputConfigs.input3 || this.realInputConfigs.input4) > 8) {
    //     return Promise.reject('Animations only available without analog input');
    // }

    if (args && args.hasOwnProperty('animation')) {
      this.log('Setting animation to', args.animation);
      if (args.animation === '0') {
        try {
          await this._sendColor(this.currentRGB.r, 2);
          await this._sendColor(this.currentRGB.g, 3);
          await this._sendColor(this.currentRGB.b, 4);
          await this._sendColor(this.currentRGB.a, 5);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(err);
        }
      }
      if (args.animation === '11') {
        args.animation = Math.round(Math.random() * (10 - 6) + 6);
      }

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


  /*
    ================================================================
    Helper methods
    ================================================================
     */
  _valueToVolt(value) {
    return Math.round(value / 99 * 100) / 10;
  }

  _reloadRealInputConfig() {
    const newInputConfig = {};

    newInputConfig.input1 = parseInt(this.getSetting('input_config_1') || 1);
    newInputConfig.input2 = parseInt(this.getSetting('input_config_2') || 1);
    newInputConfig.input3 = parseInt(this.getSetting('input_config_3') || 1);
    newInputConfig.input4 = parseInt(this.getSetting('input_config_4') || 1);

    if (this.getSetting('strip_type') !== 'cct' && this.getSetting('strip_type').indexOf('rgb') < 0) {
      newInputConfig.input1 += 8;
      newInputConfig.input2 += 8;
      newInputConfig.input3 += 8;
      newInputConfig.input4 += 8;
    }

    if (newInputConfig.input1 !== this.realInputConfigs.input1
            || newInputConfig.input2 !== this.realInputConfigs.input2
            || newInputConfig.input3 !== this.realInputConfigs.input3
            || newInputConfig.input4 !== this.realInputConfigs.input4) {
      this.realInputConfigs = newInputConfig;
      return true;
    }
    return false;
  }

  async _sendColor(value, multiChannel) {
    console.log(`Sending ${value} to ${multiChannel}`);
    return await this.node.MultiChannelNodes[multiChannel].CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({ Value: Math.round(value) });
  }

  _inputSettingParser(inputNumber, value, newSettings) {
    this.realInputConfigs[`input${inputNumber}`] = parseInt(value) || 1;

    if (newSettings && newSettings.strip_type.indexOf('rgb') < 0 && newSettings.strip_type !== 'cct') {
      this.realInputConfigs[`input${inputNumber}`] += 8;
    }

    const zwaveValue = new Buffer([
      (this.realInputConfigs.input1 * 16
                + this.realInputConfigs.input2),
      (this.realInputConfigs.input3 * 16
                + this.realInputConfigs.input4),
    ]);

    try {
      this.configurationSet({
        index: 14,
        size: 2,
      }, zwaveValue);
    } catch (err) {
      this.log(err);
    }
  }

  _reportParser(report, channel) {
    this.log('===============================================================================');
    this.log('RECEIVED VALUES');
    this.log('===============================================================================');

    let red;
    let green;
    let blue;
    let white;
    const inputNumber = channel - 1;

    switch (channel) {
      case 2:
        red = report['Value (Raw)'][0];
        break;
      case 3:
        green = report['Value (Raw)'][0];
        break;
      case 4:
        blue = report['Value (Raw)'][0];
        break;
      case 5:
        white = report['Value (Raw)'][0];
        break;
    }

    // Check if we should trigger an on/off flow for inputs
    if (this.currentRGB.r === 0 && red > 0
            || this.currentRGB.g === 0 && green > 0
            || this.currentRGB.b === 0 && blue > 0
            || this.currentRGB.a === 0 && white > 0) {
      this._onFlowTrigger.trigger(this, null, { input: inputNumber });
    } else if (this.currentRGB.r > 0 && red === 0
            || this.currentRGB.g > 0 && green === 0
            || this.currentRGB.b > 0 && blue === 0
            || this.currentRGB.a > 0 && white === 0) {
      this._offFlowTrigger.trigger(this, null, { input: inputNumber });
    }

    if (typeof red === 'number') this.currentRGB.r = red;
    if (typeof green === 'number') this.currentRGB.g = green;
    if (typeof blue === 'number') this.currentRGB.b = blue;
    if (typeof white === 'number') this.currentRGB.a = white;

    // Calculate the new HSV value
    const newColour = this._convertRGBToHSV({
      r: this.currentRGB.r / 99 * 255,
      g: this.currentRGB.g / 99 * 255,
      b: this.currentRGB.b / 99 * 255,
    });

    if (this.getCapabilityValue('light_mode') === 'color') {
      this.setCapabilityValue('light_hue', Math.round(newColour.h) / 360);
      this.setCapabilityValue('light_saturation', Math.round(newColour.s) / 100);
    }

    if (this.realInputConfigs[`input${inputNumber}`] === 8) {
      this[`_input${inputNumber}FlowTrigger`].trigger(this, { volt: this._valueToVolt(report['Value (Raw)'][0]) }, null);
    }

    return this._valueToVolt(report['Value (Raw)'][0]);
  }

}

module.exports = FibaroRGBWControllerDevice;
