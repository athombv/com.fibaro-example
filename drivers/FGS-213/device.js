'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroSingleSwitchTwoDevice extends ZwaveDevice {

  onNodeInit() {
    this._S1Trigger = this.driver.S1Trigger;
    this._S2Trigger = this.driver.S2Trigger;
    this._resetMeter = this.driver.resetMeter;

    this.registerCapability('onoff', 'SWITCH_BINARY');
    this.registerCapability('measure_power', 'METER');
    this.registerCapability('meter_power', 'METER');

    this.registerSetting('53', value => {
      const kWh = new Buffer(2);
        	kWh.writeUIntBE([Math.round(value * 100)], 0, 2);
        	return kWh;
    });

    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      if (report.hasOwnProperty('Properties1')
                && report.Properties1.hasOwnProperty('Key Attributes')
                && report.hasOwnProperty('Scene Number')) {
        const state = {
          scene: report.Properties1['Key Attributes'],
        };

        if (report['Scene Number'] === 1) {
          this._S1Trigger.trigger(this, null, state);
        } else if (report['Scene Number'] === 2) {
          this._S2Trigger.trigger(this, null, state);
        }
      }
    });
  }

  switchTriggerRunListener(args, state) {
    return (state && args
			&& state.hasOwnProperty('scene') && args.hasOwnProperty('scene')
			&& state.scene === args.scene);
  }

  resetMeterRunListener(args, state) {
    if (this.node
            && this.node.CommandClass
            && this.node.CommandClass.COMMAND_CLASS_METER) {
      this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({}, (err, result) => {
        if (err) return callback(err);

        // If properly transmitted, change the setting and finish flow card
        return result === 'TRANSMIT_COMPLETE_OK';
      });
    } else return false;
  }

}

module.exports = FibaroSingleSwitchTwoDevice;
