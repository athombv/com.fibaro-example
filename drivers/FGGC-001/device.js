'use strict';

const Homey = require('homey');
const {ZwaveDevice} = require('homey-zwavedriver');

class FibaroSwipeDevice extends ZwaveDevice {

  onNodeInit() {
    this.registerCapability('measure_battery', 'BATTERY');
    this.registerCapability('alarm_battery', 'BATTERY');

    /*
       ===================================================================
       Registering Flow triggers
       ===================================================================
        */
    this._directionTrigger = this.driver.directionTrigger;
    this._roundTrigger = this.driver.roundTrigger;
    this._sequenceTrigger = this.driver.sequenceTrigger;

    /*
        ===================================================================
        Registering gesture parsing for simple directional gestures
        ===================================================================
         */
    this.registerSetting('gesture_up', (newValue, newSettings) => {
      let gestureValue = 0;
      if (newValue) gestureValue += 1;
      if (newSettings.gesture_down) gestureValue += 2;
      if (newSettings.gesture_left) gestureValue += 4;
      if (newSettings.gesture_right) gestureValue += 8;
      if (newSettings.gesture_cw) gestureValue += 16;
      if (newSettings.gesture_ccw) gestureValue += 32;

      return gestureValue;
    });
    this.registerSetting('gesture_down', (newValue, newSettings) => {
      let gestureValue = 0;
      if (newSettings.gesture_up) gestureValue += 1;
      if (newValue) gestureValue += 2;
      if (newSettings.gesture_left) gestureValue += 4;
      if (newSettings.gesture_right) gestureValue += 8;
      if (newSettings.gesture_cw) gestureValue += 16;
      if (newSettings.gesture_ccw) gestureValue += 32;

      return gestureValue;
    });
    this.registerSetting('gesture_left', (newValue, newSettings) => {
      let gestureValue = 0;
      if (newSettings.gesture_up) gestureValue += 1;
      if (newSettings.gesture_down) gestureValue += 2;
      if (newValue) gestureValue += 4;
      if (newSettings.gesture_right) gestureValue += 8;
      if (newSettings.gesture_cw) gestureValue += 16;
      if (newSettings.gesture_ccw) gestureValue += 32;

      return gestureValue;
    });
    this.registerSetting('gesture_right', (newValue, newSettings) => {
      let gestureValue = 0;
      if (newSettings.gesture_up) gestureValue += 1;
      if (newSettings.gesture_down) gestureValue += 2;
      if (newSettings.gesture_left) gestureValue += 4;
      if (newValue) gestureValue += 8;
      if (newSettings.gesture_cw) gestureValue += 16;
      if (newSettings.gesture_ccw) gestureValue += 32;

      return gestureValue;
    });

    /*
        ===================================================================
        Registering gesture parsing for circular gestures
        ===================================================================
         */
    this.registerSetting('gesture_cw', (newValue, newSettings) => {
      let gestureValue = 0;
      if (newSettings.gesture_up) gestureValue += 1;
      if (newSettings.gesture_down) gestureValue += 2;
      if (newSettings.gesture_left) gestureValue += 4;
      if (newSettings.gesture_right) gestureValue += 8;
      if (newValue) gestureValue += 16;
      if (newSettings.gesture_ccw) gestureValue += 32;

      return gestureValue;
    });
    this.registerSetting('gesture_ccw', (newValue, newSettings) => {
      let gestureValue = 0;
      if (newSettings.gesture_up) gestureValue += 1;
      if (newSettings.gesture_down) gestureValue += 2;
      if (newSettings.gesture_left) gestureValue += 4;
      if (newSettings.gesture_right) gestureValue += 8;
      if (newSettings.gesture_cw) gestureValue += 16;
      if (newValue) gestureValue += 32;

      return gestureValue;
    });

    /*
       ===================================================================
       Registering settings parsing for gesture sequences
       ===================================================================
        */
    this.registerSetting('sequence_1', this.parseSequence.bind(this));
    this.registerSetting('sequence_2', this.parseSequence.bind(this));
    this.registerSetting('sequence_3', this.parseSequence.bind(this));
    this.registerSetting('sequence_4', this.parseSequence.bind(this));
    this.registerSetting('sequence_5', this.parseSequence.bind(this));
    this.registerSetting('sequence_6', this.parseSequence.bind(this));

    /*
       ===================================================================
       Interception of scene reports to trigger Flows
       ===================================================================
        */
    this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', report => {
      const swiped = {
        direction: report['Scene Number'].toString(),
        scene: report.Properties1['Key Attributes'],
      };

      if (report['Scene Number'] >= 1 && report['Scene Number'] <= 4) {
        this._directionTrigger.trigger(this, null, swiped);
      } else if (report['Scene Number'] >= 5 && report['Scene Number'] <= 6) {
        this._roundTrigger.trigger(this, null, swiped);
      } else {
        this._sequenceTrigger.trigger(this, null, swiped);
      }
    });
  }

  async onSettings({oldSettings, newSettings, changedKeys}) {
    /*
      If one setting changes for enabled guestures we need to recalculate the whole sum.
      This recalculates and sets the value outside super.onSettings by removing the
      changed keys from changesKeys and calling congirationSet with the calculated value.
    */
    if (changedKeys.includes('gesture_up') || changedKeys.includes('gesture_down')
      || changedKeys.includes('gesture_left') || changedKeys.includes('gesture_right')
      || changedKeys.includes('gesture_cw') || changedKeys.includes('gesture_ccw')) {
      let parsedValue = 0;
      if (newSettings.gesture_up) parsedValue += 1;
      if (newSettings.gesture_down) parsedValue += 2;
      if (newSettings.gesture_left) parsedValue += 4;
      if (newSettings.gesture_right) parsedValue += 8;
      if (newSettings.gesture_cw) parsedValue += 16;
      if (newSettings.gesture_ccw) parsedValue += 32;

      await this.configurationSet({
        index: 10,
        size: 1,
      }, parsedValue);

      changedKeys = changedKeys.filter(changedKey => !['gesture_up', 'gesture_down', 'gesture_left', 'gesture_right', 'gesture_cw', 'gesture_ccw'].includes(changedKey));
    }
    if (changedKeys.includes('double_up') || changedKeys.includes('double_down')
            || changedKeys.includes('double_left') || changedKeys.includes('double_right')) {
      let parsedValue = 0;
      if (newSettings.double_up) parsedValue += 1;
      if (newSettings.double_down) parsedValue += 2;
      if (newSettings.double_left) parsedValue += 4;
      if (newSettings.double_right) parsedValue += 8;

      await this.configurationSet({
        index: 12,
        size: 1,
      }, parsedValue);

      changedKeys = changedKeys.filter(changedKey => !['double_up', 'double_down', 'double_left', 'double_right'].includes(changedKey));
    }

    return super.onSettings({oldSettings, newSettings, changedKeys});
  }

  /*
	===================================================================
	Sequence settings parser
	===================================================================
    */
  parseSequence(sequence, settings) {
    if (!sequence) return null;

    // Split the gesture sequence to individual numbers
    const gestures = sequence.split(';').map(Number);
    if (gestures.length === 2) gestures.push(0); // Add 0 to act as the third gesture

    // Check if there are no repeated gestures next to each other.
    if (gestures[0] === gestures[1] || gestures[1] === gestures[2]) return new Error('invalid_sequence');

    const result = (gestures[0] * 256) + (gestures[1] * 16) + (gestures[2]);
    if (typeof (result) === 'NaN') return new Error('invalid_sequence');

    return result;
  }

  async directionRunListener(args, state) {
    return (state && args
			&& state.hasOwnProperty('direction')
			&& state.hasOwnProperty('scene')
			&& args.hasOwnProperty('direction')
			&& args.hasOwnProperty('scene')
			&& state.direction === args.direction
			&& state.scene === args.scene
    );
  }

  async roundRunListener(args, state) {
    return (state && args
            && state.hasOwnProperty('direction')
            && state.hasOwnProperty('scene')
            && args.hasOwnProperty('direction')
            && args.hasOwnProperty('scene')
            && state.direction === args.direction
			&& state.scene === args.scene
    );
  }

  async sequenceRunListener(args, state) {
    return (state && args
            && state.hasOwnProperty('direction')
            && args.hasOwnProperty('direction')
			&& state.direction === args.direction
    );
  }

}

module.exports = FibaroSwipeDevice;
