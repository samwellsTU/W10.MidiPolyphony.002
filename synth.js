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

// Connect master gain to the audio output
masterGain.connect(mySynthCtx.destination);

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
const startNote = function (note) {
  if (!activeVoices[note]) {
    let someVoice = new Voice(
      mySynthCtx,
      mtof(note),
      Math.random(),
      masterGain
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

const midiParser = function (midiEvent) {
  let statusByte = midiEvent.data[0];
  let command = statusByte & 0xf0;
  let channel = statusByte & 0x0f;

  switch (command) {
    case 0x80: //note off
      console.log("note off");
      stopNote(midiEvent.data[1]);
      break;
    case 0x90: //note On
      console.log("noteon", midiEvent.data[1], midiEvent.data[2]);
      if (midiEvent.data[2] > 0) {
        startNote(midiEvent.data[1]);
      } else {
        stopNote(midiEvent.data[1]);
      }
      break;
    case 0xb0:
      console.log("CC DATa");
  }

  // if (command == 0x90) {
  //   console.log("noteon", midiEvent.data[1], midiEvent.data[2]);
  //   startNote(midiEvent.data[1]);
  // }
};

const onMIDIsuccess = function (midiAccess) {
  for (let currentInput of midiAccess.inputs.values()) {
    currentInput.onmidimessage = midiParser;
  }
};

//access the MIDI
navigator.requestMIDIAccess().then(onMIDIsuccess);
