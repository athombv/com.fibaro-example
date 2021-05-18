'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class FibaroDoubleSmartModuleDevice extends ZwaveDevice {

  async onNodeInit() {
    // If not multi channel node this is the main node, use multi channel node 1 for that
    if (!this.node.isMultiChannelNode) {
      // Register capabilities on multi channel node 1
      // this.enableDebug();
      // this.printNode();

      this.registerCapability('onoff', 'SWITCH_BINARY');

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
    }
  }

  inputFlowListener(args, state) {
    return (state && args
      && state.hasOwnProperty('scene') && args.hasOwnProperty('scene')
      && state.scene === args.scene);
  }

}

module.exports = FibaroDoubleSmartModuleDevice;
