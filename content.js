document.addEventListener("startAudioExtraction", () => {
    const video = document.querySelector("video");
    
    if (video) {
      chrome.runtime.sendMessage({ videoUrl: video.src });
    } else {
      alert("No video found on the page.");
    }
  });