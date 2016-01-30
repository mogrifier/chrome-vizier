/**
 * 
 */
// web audio api context
var audioCtx;
// create nodes
var oscillator;
var osc2nd;
var filter;
var gainNode;
var gainNode2nd;
var reverb;

//arrays for parameter curves
var frequency;
var harmonic2nd;
var filterFreq;
var filterQ;
var gain;
var reverb;
var reverbBuffer;

var rawFrequency;
var rawFilterFreq;
var rawFilterQ;
var rawGain;

var duration = 200;
//for noise samples
var bufferSize = 4096;

window.addEventListener("load", initialize);

/**
 * Add listeners to UI controls that need them. No javascript allowed in html file.
 */
function initialize()
{
	// create web audio api context
	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	
	//not sure what final controls will be, but here is how to do it
	document.getElementById("startButton").addEventListener("click", start);

	document.getElementById("stopButton").addEventListener("click", stop);
	document.getElementById("carrier").addEventListener("click", adjustCarrier);

	document.getElementById("mod").addEventListener("click", adjustMod);

	reverbBuffer = createReverbData(20, 70);
	
	downloadAndPlay();
}




/**I think there is a way to use event handling to keep playback going and downloading new data files. Here is how.
 * First, addListener for certain events that occur often. URL transitions, typing, scrolling, etc.
 * Respond to event with simple function to reload the data and start playing again. Could use a curve to fade out
 * the current audio (apply to gain). The function would test if it is time to reload or not based on current time
 * and when last playback started. No need for a settimeout call (which is now a pain anyway).
 * 
 * 
 */

function downloadAndPlay()
{

		DATAREADER.parseDataFromGoes('http://services.swpc.noaa.gov/text/goes-magnetospheric-particle-flux-ts5-primary.txt',
				prepareDataForPlayback);

}


/**
 * This is a callback function. It receives data from the DATAREADER and massages it into proper ranges
 * for playback. It also removes bad data that blocks playback and/or causes errors.
 * @param response
 */
function prepareDataForPlayback(response)
{
	//response is a 2D array. create new arrays from it, with range mapped values
	//and associate to AudioParams for automating frequency changes, filters, gain, reverb, etc.
	
	rawFrequency = new Float32Array(response.length);
	rawFilterFreq = new Float32Array(response.length);
	rawFilterQ = new Float32Array(response.length);
	rawGain = new Float32Array(response.length);
	
	frequency = new Float32Array(response.length);
	harmonic2nd = new Float32Array(response.length);
	filterFreq = new Float32Array(response.length);
	filterQ = new Float32Array(response.length);
	gain = new Float32Array(response.length);
	

	for (var i = 0; i < response.length; i++)
	{
		//make new arrays of data to use. convert scientific notation to decimal numbers
		rawFrequency[i] = UTILITY.makeNumber(response[i][9]);
		rawFilterFreq[i] = UTILITY.makeNumber(response[i][2]);
		rawFilterQ[i] = UTILITY.makeNumber(response[i][0]);
		rawGain[i] = UTILITY.makeNumber(response[i][4]);
	}
	
	
	/**
	 * Need to add UI controls for ranges of frequency, filtering, gain, etc.
	 * Controls to choose the oscillator type.
	 * Reverb space.
	 * Noise type.
	 * Playback speed (duration)
	 * 
	 */
	
	
	for (var i = 0; i < response.length; i++)
	{
		//go through each array and add values to new arrays, using UTILITY.rangemap
		//fix max and min values
		frequency[i] = UTILITY.rangemap(rawFrequency[i], Math.min(...rawFrequency), Math.max(...rawFrequency), 75, 650);
		harmonic2nd[i] = frequency[i] * 0.707;
		filterFreq[i] = UTILITY.rangemap(rawFilterFreq[i], Math.min(...rawFilterFreq), Math.max(...rawFilterFreq), 300, 1200);
		filterQ[i] = UTILITY.rangemap(rawFilterQ[i], Math.min(...rawFilterQ), Math.max(...rawFilterQ), 80, 110);
		gain[i] = UTILITY.rangemap(rawGain[i], Math.min(...rawGain), Math.max(...rawGain), 0, 4);
	}
	
	//call start or enable a button
	start(0, duration);

}




function start(startTime, duration)
{
	if (isNaN(startTime))
	{
		startTime = 0;
	}

	if (isNaN(duration))
	{
		duration = 300;
	}
	
	//webaudio example
	
	gainNode = audioCtx.createGain();
	gainNode2nd = audioCtx.createGain();
	//fix a low gain for the harmonic
	gainNode2nd.gain.value = 0.8;
	reverb = audioCtx.createConvolver();
	//load with data from function called during initialize
	reverb.buffer = reverbBuffer;
	
	
	oscillator = audioCtx.createOscillator();
	osc2nd = audioCtx.createOscillator();
	osc2nd.detune.value = 10;
	filter = audioCtx.createBiquadFilter();
	filter.type = "lowpass";
	
	var pinkNoise = (function() {
	    var b0, b1, b2, b3, b4, b5, b6;
	    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
	    var node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
	    node.onaudioprocess = function(e) {
	        var output = e.outputBuffer.getChannelData(0);
	        for (var i = 0; i < bufferSize; i++) {
	            var white = Math.random() * 2 - 1;
	            b0 = 0.99886 * b0 + white * 0.0555179;
	            b1 = 0.99332 * b1 + white * 0.0750759;
	            b2 = 0.96900 * b2 + white * 0.1538520;
	            b3 = 0.86650 * b3 + white * 0.3104856;
	            b4 = 0.55000 * b4 + white * 0.5329522;
	            b5 = -0.7616 * b5 - white * 0.0168980;
	            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
	            output[i] *= 0.041; // (roughly) compensate for gain
	            b6 = white * 0.115926;
	        }
	    }
	    return node;
	})();

	var brownNoise = (function() {
	    var lastOut = 0.0;
	    var node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
	    node.onaudioprocess = function(e) {
	        var output = e.outputBuffer.getChannelData(0);
	        for (var i = 0; i < bufferSize; i++) {
	            var white = Math.random() * 2 - 1;
	            output[i] = (lastOut + (0.02 * white)) / 1.02;
	            lastOut = output[i];
	            output[i] *= 3.5; // (roughly) compensate for gain
	        }
	    }
	    return node;
	})();

	
	
	//add noise
	//pinkNoise.connect(gainNode2nd);
	brownNoise.connect(gainNode2nd);
	
	oscillator.frequency.setValueCurveAtTime(frequency, startTime, duration);
	osc2nd.frequency.setValueCurveAtTime(harmonic2nd, startTime, duration);
	filter.frequency.setValueCurveAtTime(filterFreq, startTime, duration);
	filter.Q.setValueCurveAtTime(filterQ, startTime, duration);
	gainNode.gain.setValueCurveAtTime(gain, startTime, duration);
	
	oscillator.connect(filter);
	osc2nd.connect(gainNode2nd);
	oscillator.type = 'square';
	osc2nd.type = 'square';
	
	console.log ("starting audio");
	
	filter.connect(gainNode);
	gainNode.connect(reverb);
	gainNode2nd.connect(reverb);
	
	reverb.connect(audioCtx.destination);
	oscillator.start();
	osc2nd.start();

}


/**
 * generate a reverb for a space based on parameters.
 * seconds = 1-50
 * decay = 1-100
 */
function createReverbData(seconds, decay) {
    var rate = audioCtx.sampleRate
      , length = rate * seconds
      , impulse = audioCtx.createBuffer(2, length, rate)
      , impulseL = impulse.getChannelData(0)
      , impulseR = impulse.getChannelData(1)
      , n, i;

    for (i = 0; i < length; i++) {
      n = this.reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }

    console.log('generated reverb data');
    return impulse;
  }


function stop()
{
	oscillator.stop();
	osc2nd.stop();
	//brownNoise.disconnect(gainNode2nd);
	console.log('stopped audio');
}


function adjustCarrier()
{
	oscillator.frequency.value = document.getElementById('carrier').value;
	console.log('carrier frequency=' + oscillator.frequency.value );
	//console.log('modulating frequency=' + osc2.frequency.value );
}


function adjustMod()
{
	filter.frequency.value = document.getElementById('mod').value;
	//console.log('modulating frequency=' + osc2.frequency.value );
	console.log('carrier frequency=' + filter.frequency.value );
	//console.log(oscillator.frequency.value );
}

