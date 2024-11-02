document.getElementById("extract-audio").addEventListener("click", () => {
    const language = document.getElementById("language-select").value;
    
    // Store the selected language
    chrome.storage.local.set({ language }, () => {
      // Send a message to content script to start audio extraction
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => document.dispatchEvent(new Event("startAudioExtraction"))
        });
      });
    });
  });