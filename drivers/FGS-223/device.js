'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

const CONFIGURED_MULTI_CHANNEL_ASSOCIATION = 'configuredMCAssociation';

class FibaroDoubleSwitchTwoDevice extends ZwaveDevice {

  async onNodeInit() {
    // If not multi channel node this is the main node, use multi channel node 1 for that
    if (!this.node.isMultiChannelNode) {
      // Migration step to configure multi channel association reporting
      await this._configureMultiChannelNodeReporting();

      // Register capabilities on multi channel node 1
      this.registerCapability('onoff', 'SWITCH_BINARY', {multiChannelNodeId: 1});
      this.registerCapability('measure_power', 'METER', {multiChannelNodeId: 1});
      this.registerCapability('meter_power', 'METER', {multiChannelNodeId: 1});

      this._input1FlowTrigger = this.driver.input1FlowTrigger;
      this._input2FlowTrigger = this.driver.input2FlowTrigger;

      if (this.hasCommandClass('CENTRAL_SCENE')) {
        this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
          if (report.hasOwnProperty('Properties1')
						&& report.Properties1.hasOwnProperty('Key Attributes')
						&& report.hasOwnProperty('Scene Number')) {
            const state = {
              scene: report.Properties1['Key Attributes'],
            };

            if (report['Scene Number'] === 1) {
              this._input1FlowTrigger.trigger(this, null, state);
            } else if (report['Scene Number'] === 2) {
              this._input2FlowTrigger.trigger(this, null, state);
            }
          }
        });
      }
    } else {
      // Register capabilities (this will be registered on multi channel node 2)
      this.registerCapability('onoff', 'SWITCH_BINARY');
      if (this.hasCapability('meter_power')) this.registerCapability('meter_power', 'METER');
      if (this.hasCapability('measure_power')) this.registerCapability('measure_power', 'METER');
    }

    this._resetMeterFlowAction = this.driver.resetMeterFlowAction;

    this.registerSetting('s1_kwh_report', this._kwhReportParser);
  }

  /**
	 * Method that sets a multi channel association (1.1) if not set before.
	 * @returns {Promise<void>}
	 * @private
	 */
  async _configureMultiChannelNodeReporting() {
    const configuredMultiChannelReporting = this.getStoreValue(CONFIGURED_MULTI_CHANNEL_ASSOCIATION);
    if (!configuredMultiChannelReporting && this.getSetting('zw_group_1') !== '1.1' && this.node.CommandClass.COMMAND_CLASS_MULTI_CHANNEL_ASSOCIATION) {
      if (this.node.CommandClass.COMMAND_CLASS_MULTI_CHANNEL_ASSOCIATION.MULTI_CHANNEL_ASSOCIATION_SET) {
        await this.node.CommandClass.COMMAND_CLASS_ASSOCIATION.ASSOCIATION_REMOVE(new Buffer([1, 1]));
        await this.node.CommandClass.COMMAND_CLASS_MULTI_CHANNEL_ASSOCIATION.MULTI_CHANNEL_ASSOCIATION_SET(
          new Buffer([1, 0x00, 1, 1]),
        );
        await this.setSettings({ zw_group_1: '1.1' });
        await this.setStoreValue(CONFIGURED_MULTI_CHANNEL_ASSOCIATION, true);
        this.log('configured multi channel node reporting');
      }
    }
  }

  inputFlowListener(args, state) {
    return (state && args
			&& state.hasOwnProperty('scene') && args.hasOwnProperty('scene')
			&& state.scene === args.scene);
  }

  async resetMeterFlowListener(args) {
    if (this.node
			&& this.node.CommandClass.COMMAND_CLASS_METER) {
      return await this.node.CommandClass.COMMAND_CLASS_METER.METER_RESET({});
    }
    return Promise.reject('This device does not support meter resets');
  }

  _kwhReportParser(newValue) {
    const kwh = new Buffer(2);
    kwh.writeUIntBE([Math.round(newValue * 100)], 0, 2);
    return kwh;
  }

}

module.exports = FibaroDoubleSwitchTwoDevice;
