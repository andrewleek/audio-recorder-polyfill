module.exports = function () {

  let channels = 1
  let sampleRate = 44100
  let kbps = 128
  let encoder;
  let sampleBlockSize = 1152
  let mp3Data = []
  let mp3buf
  let lamejsPath = './lame.min.js'

  var floatTo16BitPCM = function floatTo16BitPCM(input, output) {
    for (var i = 0; i < input.length; i++) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
  };

  var convertBuffer = function(arrayBuffer){
    var data = new Float32Array(arrayBuffer);
    var out = new Int16Array(arrayBuffer.length);
    floatTo16BitPCM(data, out)
    return out;
  };

  function init(config)
  {
    if(config.channels) {channels = config.channels};
    if(config.sampleRate) {sampleRate = config.sampleRate};
    if(config.kbps) {kbps = config.kbps};
    if(config.sampleBlockSize) {sampleBlockSize = config.sampleBlockSize};
    if(config.lamejsPath) {lamejsPath = config.lamejsPath};

    importScripts(lamejsPath);

    encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  }

  function encode (buffer)
  {
    data = convertBuffer(buffer);

    for (let i = 0; i < data.length; i += sampleBlockSize) {
      let sampleChunk = data.subarray(i, i + sampleBlockSize)
  
      mp3buf = encoder.encodeBuffer(sampleChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf))
      }
    }
  }

  function dump ()
  {
    mp3buf = encoder.flush()

    if (mp3buf.length > 0)
    {
      mp3Data.push(new Int8Array(mp3buf))
    }

    let length = 0;

    for (var i = 0; i < mp3Data.length; i++)
    {
      length += mp3Data[i].length;
    }

    let mp3 = new Int8Array(length);

    let offset = 0;

    for (var i = 0; i < mp3Data.length; i++)
    {
      mp3.set(mp3Data[i], offset)
      offset += mp3Data[i].length;
    }

    mp3Data = [];

    postMessage(mp3.buffer,[mp3.buffer])
  }

  onmessage = function (e) 
  {
    switch (e.data.cmd) {
      case 'init':
        init(e.data.config);
        break;

      case 'encode':
        encode(e.data.payload);
        break;

      case 'dump':
        dump();
        break;
    }
  }
}