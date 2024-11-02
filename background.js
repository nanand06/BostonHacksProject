chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.videoUrl) {
      fetchAudioChunks(message.videoUrl);
    }
  });
  
  async function fetchAudioChunks(videoUrl) {
    try {
      const response = await fetch(videoUrl);
      const videoBlob = await response.blob();
      const audioContext = new AudioContext();
      const arrayBuffer = await videoBlob.arrayBuffer();
  
      // Decode the audio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
      // Extract 1-3 second audio chunks
      const chunkLength = 2; // 2 seconds per chunk
      const sampleRate = audioBuffer.sampleRate;
      const chunkSamples = sampleRate * chunkLength;
  
      for (let i = 0, chunkIndex = 0; i < audioBuffer.length; i += chunkSamples, chunkIndex++) {
        const endSample = Math.min(i + chunkSamples, audioBuffer.length);
        const chunk = audioBuffer.getChannelData(0).slice(i, endSample);
  
        // Create a new buffer for each chunk and fill it with the extracted audio samples
        const chunkBuffer = audioContext.createBuffer(1, chunk.length, sampleRate);
        chunkBuffer.copyToChannel(chunk, 0);
  
        // Export each chunk as a .wav file
        const wavBlob = await exportWAV(chunkBuffer);
        const url = URL.createObjectURL(wavBlob);
  
        // Use Chrome Downloads API to save the file
        chrome.downloads.download({
          url: url,
          filename: `audio_chunk_${chunkIndex}.wav`,
          saveAs: true
        });
      }
    } catch (error) {
      console.error("Error extracting audio chunks:", error);
    }
  }
  
  // Function to convert AudioBuffer to WAV Blob
  async function exportWAV(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
  
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * numChannels * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * numChannels * 2, true);
  
    // Write PCM samples
    const offset = 44;
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      const channelData = audioBuffer.getChannelData(i);
      let index = offset + i * 2;
      for (let sample = 0; sample < channelData.length; sample++) {
        view.setInt16(index, channelData[sample] * 0x7FFF, true);
        index += numChannels * 2;
      }
    }
  
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  // Helper function to write string to DataView
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }