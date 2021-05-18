'use strict';

const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroWalliSwitchDevice extends ZwaveDevice {

  async onNodeInit() {

    this.singleSwitchMode = this.node.productTypeId.value === 6657;

    this.registerCapability('onoff.output1', 'SWITCH_BINARY');

    this.registerCapability('measure_power.output1', 'METER', { multiChannelNodeId: 1 }, {
      reportParser: report => {
        if (report
                && report.hasOwnProperty('Properties1')
                && report.Properties1.hasOwnProperty('Meter Type')
                && (report.Properties1['Meter Type'] === 'Electric meter' || report.Properties1['Meter Type'] === 1)
                && report.Properties1.hasOwnProperty('Scale bit 2')
                && report.Properties1['Scale bit 2'] === false
                && report.hasOwnProperty('Properties2')
                && report.Properties2.hasOwnProperty('Scale bits 10')
                && report.Properties2['Scale bits 10'] === 2) {
          this.driver.powerChangedTrigger.trigger(this,
            { power: report['Meter Value (Parsed)'] },
            { output: 1 });
          return report['Meter Value (Parsed)'];
        }
      },
    }, { multiChannelNodeId: 2 });
    this.registerCapability('meter_power.output1', 'METER', { multiChannelNodeId: 1 });

    if (!this.singleSwitchMode) {
      if (await !this.hasCapability('onoff.output2')) await this.addCapability('onoff.output2', { multiChannelNodeId: 2 });
      if (await !this.hasCapability('measure_power.output2')) await this.addCapability('measure_power.output2', { multiChannelNodeId: 2 });
      if (await !this.hasCapability('meter_power.output2')) await this.addCapability('meter_power.output2', { multiChannelNodeId: 2 });

      this.registerCapability('onoff.output2', 'SWITCH_BINARY', { multiChannelNodeId: 2 });

      this.registerCapability('measure_power.output2', 'METER', { multiChannelNodeId: 2 }, {
        reportParser: report => {
          if (report
                        && report.hasOwnProperty('Properties1')
                        && report.Properties1.hasOwnProperty('Meter Type')
                        && (report.Properties1['Meter Type'] === 'Electric meter' || report.Properties1['Meter Type'] === 1)
                        && report.Properties1.hasOwnProperty('Scale bit 2')
                        && report.Properties1['Scale bit 2'] === false
                        && report.hasOwnProperty('Properties2')
                        && report.Properties2.hasOwnProperty('Scale bits 10')
                        && report.Properties2['Scale bits 10'] === 2) {
            this.driver.powerChangedTrigger.trigger(this,
              { power: report['Meter Value (Parsed)'] },
              { output: 2 });
            return report['Meter Value (Parsed)'];
          }
        },
      });
      this.registerCapability('meter_power.output2', 'METER', { multiChannelNodeId: 2 });
    } else {
      if (await this.hasCapability('onoff.output2')) await this.removeCapability('onoff.output2');
      if (await this.hasCapability('measure_power.output2')) await this.removeCapability('measure_power.output2');
      if (await this.hasCapability('meter_power.output2')) await this.removeCapability('meter_power.output2');
    }

    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      if (report
                && report.hasOwnProperty('Properties1')
                && report.hasOwnProperty('Scene Number')
                && report.Properties1.hasOwnProperty('Key Attributes')) {
        const button = Number(report['Scene Number']);
        let presses;
        if (report.Properties1['Key Attributes'] == 'Key Held Down') {
          presses = 4;
        } else if (report.Properties1['Key Attributes'] == 'Key Released') {
          presses = 5;
        } else {
          presses = Number(report.Properties1['Key Attributes'].match(/\d+/)[0]);
        }

        this.driver.buttonSceneTrigger.trigger(this, {}, { button, presses });
      }
    });
  }

  async setOutputRunListener(args, state, value) {
    if (!args.output) return new Error('Missing arguments');
    const output = Number(args.output);

    if (output === 2 && this.singleSwitchMode) return new Error('Can\'t set output 2 in' +
      ' single switch mode!');

    if (output === 1) {
      this.setCapabilityValue('onoff.output1', value);
      return this._setCapabilityValue('onoff.output1', 'SWITCH_BINARY', value);
    }
    if (output === 2) {
      this.setCapabilityValue('onoff.output2', value);
      return this._setCapabilityValue('onoff.output2', 'SWITCH_BINARY', value);
    }
    return new Error('Incorrect output');
  }

  async ledOnRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 11,
        size: 1,
        id: 'led_ring_color_on',
      }, new Buffer([args.color]));
    }
  }

  async ledOffRunListener(args, state) {
    if (args.hasOwnProperty('color')) {
      return this.configurationSet({
        index: 12,
        size: 1,
        id: 'led_ring_color_off',
      }, new Buffer([args.color]));
    }
  }

}

module.exports = FibaroWalliSwitchDevice;
