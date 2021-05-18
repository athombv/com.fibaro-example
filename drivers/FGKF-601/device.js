'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroKeyfob extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('measure_battery', 'BATTERY');

    // Registering flows
    this._sceneFlowTrigger = this.driver.sceneFlowTrigger;
    this._sequenceFlowTrigger = this.driver.sequenceFlowTrigger;

    // Parsing of sequences before sending to Keyfob
    this.registerSetting('lock_timeout', newValue => {
      try {
        const requestTimeout = setTimeout(() => {
          Promise.reject('device_asleep');
        }, 5000);
        this._enableLockMode({ lock_timeout: newValue });
        clearTimeout(requestTimeout);
        return newValue;
      } catch (err) {
        this.error(err);
        return this.getSetting('lock_timeout');
      }
    });
    this.registerSetting('sequence_lock', newValue => {
      try {
        const requestTimeout = setTimeout(() => {
          Promise.reject('device_asleep');
        }, 5000);
        this._enableLockMode({ sequence_lock: newValue });
        clearTimeout(requestTimeout);
        return this.sequenceParser(newValue);
      } catch (err) {
        this.error(err);
        return this.getSetting('sequence_lock');
      }
    });
    this.registerSetting('sequence_1', newValue => this.sequenceParser(newValue));
    this.registerSetting('sequence_2', newValue => this.sequenceParser(newValue));
    this.registerSetting('sequence_3', newValue => this.sequenceParser(newValue));
    this.registerSetting('sequence_4', newValue => this.sequenceParser(newValue));
    this.registerSetting('sequence_5', newValue => this.sequenceParser(newValue));
    this.registerSetting('sequence_6', newValue => this.sequenceParser(newValue));

    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      if (report
                && report.hasOwnProperty('Scene Number')
                && report.hasOwnProperty('Properties1')
                && report.Properties1.hasOwnProperty('Key Attributes')) {
        if (report['Scene Number'] <= 6) {
          this._sceneFlowTrigger.trigger(this, null, { button: report['Scene Number'].toString(), scene: report.Properties1['Key Attributes'] });
        } else {
          this._sequenceFlowTrigger.trigger(this, null, { sequence: report['Scene Number'].toString() });
        }
      }
    });
  }

  customSaveMessage(oldSettings, newSettings, changedKeysArr) {
	    return {
	        en: 'To save the settings you need to wake up the Keyfob:\\n1: press O and -,\\n2: press the Δ button repeatedly until the LED is green;\\n3: press + to wake up.',
      nl: 'Om de instellingen op te slaan moet je de Keyfob wakker maken: \\n1: druk op O en -,\\n2: druk herhaaldelijk op de Δ knop totdat de LED groen is;\\n3: druk op + om wakker te maken.',
    };
  }

  async _enableLockMode(newValueObj) {
	    if ((typeof newValueObj.lock_timeout === 'number'
                && newValueObj.lock_timeout > 0
                && this.getSetting('sequence_lock'))
                || (typeof newValueObj.sequence_lock === 'string'
                && this.getSetting('lock_timeout') > 0)) {
	    	await this.node.CommandClass.COMMAND_CLASS_PROTECTION.PROTECTION_SET({
        Level: {
          'Local Protection State': 1,
        },
        Level2: {
          'RF Protection State': 0,
        },
      });
    }

    await this.node.CommandClass.COMMAND_CLASS_PROTECTION.PROTECTION_SET({
      Level: {
        'Local Protection State': 0,
      },
      Level2: {
        'RF Protection State': 0,
      },
    });
  }

  sequenceParser(sequence) {
    // if gesture is disabled return 0 as value
    if (sequence === 0) return new Buffer([0, 0]);

    // split sequence into individual buttons
    const buttons = sequence.split(';').map(Number);

    // Parse the buttons to their corresponding value
    let parsing = buttons[0] + 8 * buttons[1];
    if (buttons[2]) parsing += 64 * buttons[2];
    if (buttons[3]) parsing += 512 * buttons[3];
    if (buttons[4]) parsing += 4096 * buttons[4];

    // return parsed buffer value
    const parsedSequence = new Buffer(2);
    parsedSequence.writeUIntBE(parsing, 0, 2);
    return parsedSequence;
  }

  sceneRunListener(args, state) {
    return (state
            && state.hasOwnProperty('button')
            && state.hasOwnProperty('scene')
            && args.hasOwnProperty('button')
            && args.hasOwnProperty('scene')
            && state.button === args.button
            && state.scene === args.scene);
  }

  sequenceRunListener(args, state) {
    return (state
            && state.hasOwnProperty('sequence')
            && args.hasOwnProperty('sequence')
            && state.sequence === args.sequence);
  }

}

module.exports = FibaroKeyfob;
