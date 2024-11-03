chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  
  if (message.action === "startAudioExtraction") {
      fetchAudioChunks(message.videoUrl);
  }

  if (message.transcription) {
      displayTranscription(message.transcription);
  }
});

async function fetchAudioChunks(videoUrl) {
  try {
      const response = await fetch(videoUrl);
      const videoBlob = await response.blob();
      const audioContext = new AudioContext();
      const arrayBuffer = await videoBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const chunkLength = 2; // 2 seconds per chunk
      const sampleRate = audioBuffer.sampleRate;
      const chunkSamples = sampleRate * chunkLength;
      const audioChunks = [];

      for (let i = 0; i < audioBuffer.length; i += chunkSamples) {
          const endSample = Math.min(i + chunkSamples, audioBuffer.length);
          const chunk = audioBuffer.getChannelData(0).slice(i, endSample);
          const chunkBuffer = audioContext.createBuffer(1, chunk.length, sampleRate);
          chunkBuffer.copyToChannel(chunk, 0);
          audioChunks.push(chunkBuffer);
      }

      for (const chunk of audioChunks) {
          const wavBlob = await exportWAV(chunk);
          const url = URL.createObjectURL(wavBlob);
          chrome.runtime.sendMessage({ audioBlobUrl: url });
      }
  } catch (error) {
      console.error("Error extracting audio chunks:", error);
  }
}

async function exportWAV(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numChannels * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

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

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function displayTranscription(transcription) {
  const transcriptionDiv = document.createElement('div');
  transcriptionDiv.style.position = 'fixed';
  transcriptionDiv.style.bottom = '10px';
  transcriptionDiv.style.left = '10px';
  transcriptionDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  transcriptionDiv.style.padding = '10px';
  transcriptionDiv.style.border = '1px solid #ccc';
  transcriptionDiv.style.zIndex = 1000;
  transcriptionDiv.innerText = transcription;

  document.body.appendChild(transcriptionDiv);
}
