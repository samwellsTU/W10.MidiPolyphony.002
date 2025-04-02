import Voice from "./Voice.js";

/**
 * @constant {AudioContext} mySynthCtx
 * @description The main WebAudio AudioContext for the synthesizer.
 */
const mySynthCtx = new AudioContext();

/**
 * @constant {Object} activeVoices
 * @description Stores currently active voices, indexed by MIDI note number.
 */
const activeVoices = {};

/**
 * @constant {GainNode} masterGain
 * @description Master gain control for the synth.
 */
const masterGain = mySynthCtx.createGain();
masterGain.gain.value = 0.125; // Set master volume

//add in a filter
const lpFilter = mySynthCtx.createBiquadFilter();
lpFilter.type = "lowpass";
lpFilter.frequency.value = 500;

// Connect master gain to the audio output
masterGain.connect(lpFilter);
lpFilter.connect(mySynthCtx.destination);

/**
 * @function mtof
 * @description Converts a MIDI note number to its corresponding frequency in Hz.
 * @param {number} midi - The MIDI note number (e.g., 60 for C4).
 * @returns {number} The frequency in Hz.
 */
const mtof = function (midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * @function startNote
 * @description Starts a note by creating and storing a new Voice instance.
 * @param {number} note - The MIDI note number.
 */
const startNote = function (note, velocity) {
  if (!activeVoices[note]) {
    let someVoice = new Voice(
      mySynthCtx, //the audio context
      mtof(note), //the frequency
      velocity / 127, //maximum amplitude
      masterGain //output audio node
    );
    activeVoices[note] = someVoice;
    activeVoices[note].start(); //someVoice.start()
    console.log(activeVoices);
  }
};

/***
 * @function stopNote
 * @description Stops a currently playing note and removes it from activeVoices.
 * @param {number} note - The MIDI note number.
 */
const stopNote = function (note) {
  if (activeVoices[note]) {
    activeVoices[note].stop();
    delete activeVoices[note];
    console.log(activeVoices);
  }
};

const ccMIDI = function (ccNum, ccVal) {
  switch (ccNum) {
    case 79:
      masterGain.gain.linearRampToValueAtTime(
        Math.pow(ccVal / 127, 3),
        mySynthCtx.currentTime + 0.01
      );
      break;
    case 78:
      lpFilter.frequency.value = ccVal * 10;
      break;
    case 77:
      lpFilter.Q.value = (ccVal / 127) * 30;
      break;
  }

  // if (ccNum == 79) {
  //
  //   );
  // } else if (ccNum == 78) {
  //   lpFilter.frequency.value = ccNum * 100;
  //   lpFilter.Q.value = (ccVal / 127) * 30;
  // }
};

const midiParser = function (midiEvent) {
  let statusByte = midiEvent.data[0];
  let dataByte1 = midiEvent.data[1];
  let dataByte2 = midiEvent.data[2];
  let command = statusByte & 0xf0;
  let channel = statusByte & 0x0f;

  switch (command) {
    //----------------------Note Off Message---------------------------
    case 0x80:
      console.log("note off");
      stopNote(dataByte1);
      break;
    //----------------------Note On Message---------------------------
    case 0x90:
      console.log("note on");
      //test the velocity to see if is postive, in the case the MIDI controller
      //sends note on messages with 0 velocity instead of note off
      if (dataByte2 > 0) {
        startNote(dataByte1, dataByte2);
      } else {
        stopNote(dataByte1);
      }
      break;
    //----------------------Polyphonic Aftertouch---------------------------
    case 0xa0:
      console.log("Polyphonic Aftertouch");
      break;
    //----------------------Control Change---------------------------
    case 0xb0:
      // console.log("Control Change", dataByte1, dataByte2);
      ccMIDI(dataByte1, dataByte2);
      break;
    //----------------------Program Change---------------------------
    case 0xc0:
      console.log("Program Change");
      break;
    //----------------------Channel Aftertouch	---------------------------
    case 0xd0:
      console.log("Channel Aftertouch	");

      break;
    //----------------------Pitch Bend---------------------------
    case 0xe0:
      console.log("Pitch Bend");
      break;
  }
};

const onMIDIsuccess = function (midiAccess) {
  for (let currentInput of midiAccess.inputs.values()) {
    currentInput.onmidimessage = midiParser;
  }
};

//access the MIDI
navigator.requestMIDIAccess().then(onMIDIsuccess);
