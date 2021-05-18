'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroDimmerTwoDevice extends ZwaveDevice {

  async onNodeInit() {
    this._momentaryTrigger = this.driver.momentaryTrigger;
    this._toggleTrigger = this.driver.toggleTrigger;
    this._rollerTrigger = this.driver.rollerTrigger;

    this._brightnessAction = this.driver._brightnessAction;
    this._dimDurationAction = this.driver._dimDurationAction;
    this._setTimerAction = this.driver._setTimerAction;
    this._resetMeterAction = this.driver._resetMeterAction;

    this.registerCapability('onoff', 'SWITCH_MULTILEVEL');
    this.registerCapability('dim', 'SWITCH_MULTILEVEL');
    this.registerCapability('measure_power', 'SENSOR_MULTILEVEL');
    this.registerCapability('meter_power', 'METER');

    this.registerSetting('force_no_dim', value => (value ? 2 : 0));
    this.registerSetting('kwh_report', value => value * 100);

    this.registerReportListener('SCENE_ACTIVATION', 'SCENE_ACTIVATION_SET', report => {
      if (!report['Scene ID']) return null;
      if (report.hasOwnProperty('Scene ID')) {
        const data = {
          scene: report['Scene ID'].toString(),
        };

        switch (this.getSetting('switch_type')) {
          case '0':
            return this._momentaryTrigger.trigger(this, null, data);
          case '1':
            return this._toggleTrigger.trigger(this, null, data);
          case '2':
            return this._rollerTrigger.trigger(this, null, data);
          default:
            return null;
        }
      }
    });
  }

  async setBrightnessRunListener(args, state) {
    if (!args.hasOwnProperty('set_forced_brightness_level')) return Promise.reject('set_forced_brightness_level_property_missing');
    if (typeof args.set_forced_brightness_level !== 'number') return Promise.reject('forced_brightness_level_is_not_a_number');
    if (args.set_forced_brightness_level > 1) return Promise.reject('forced_brightness_level_out_of_range');

    try {
      const brightnessLevel = Math.round(args.set_forced_brightness_level * 99);
      const result = await this.configurationSet({
        id: 'forced_brightness_level',
      }, brightnessLevel);
      return this.setSettings({
        forced_brightness_level: brightnessLevel,
      });
    } catch (error) {
      return Promise.reject(error.message);
    }
  }

  async dimDurationRunListener(args, state) {
    if (!args.hasOwnProperty('dimming_duration')) return Promise.reject('dimming_duration_property_missing');
    if (typeof args.dimming_duration !== 'number') return Promise.reject('dimming_duration_is_not_a_number');
    if (args.brightness_level > 1) return Promise.reject('brightness_level_out_of_range');
    if (args.dimming_duration > 127) return Promise.reject('dimming_duration_out_of_range');

    if (this.node.CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL) {
      return this.node.CommandClass.COMMAND_CLASS_SWITCH_MULTILEVEL.SWITCH_MULTILEVEL_SET({
        Value: new Buffer([Math.round(args.brightness_level * 99)]),
        'Dimming Duration': new Buffer([args.dimming_duration + (args.duration_unit * 127)]),
      });
    }
    return Promise.reject('unknown_error');
  }

  async setTimerRunListener(args, state) {
    if (!args.hasOwnProperty('set_timer_functionality')) return Promise.reject('set_timer_property_missing');
    if (typeof args.set_timer_functionality !== 'number') return Promise.reject('set_timer_is_not_a_number');
    if (args.set_timer_functionality > 32767) return Promise.reject('set_timer_out_of_range');

    let value = null;
    try {
      value = new Buffer(2);
      value.writeIntBE(args.set_timer_functionality, 0, 2);
    } catch (err) {
      return Promise.reject('failed_to_write_config_value_to_buffer');
    }

    try {
      const result = await this.configurationSet({
        id: 'timer_functionality',
      }, value);
      return this.setSettings({
        timer_functionality: args.set_timer_functionality,
      });
    } catch (error) {
      return Promise.reject(error.message);
    }
  }

  async resetMeterRunListener(args, state) {
    if (this.node.CommandClass.COMMAND_CLASS_METER) {
      return await this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({});
    }
    return Promise.reject('unknown_error');
  }

  switchTriggersRunListener(args, state) {
    return state && args && state.scene === args.scene;
  }

}

module.exports = FibaroDimmerTwoDevice;
