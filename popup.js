document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("extract-audio").addEventListener("click", () => {
        const language = document.getElementById("language-search").value;
        chrome.storage.local.set({ language }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0 && tabs[0].id) {
                    console.log("Active tab URL:", tabs[0].url);
                    chrome.tabs.sendMessage(tabs[0].id, { action: "startAudioExtraction" }, (response) => {
                        if (chrome.runtime.lastError) {
                            //console.error("Error sending message:", chrome.runtime.lastError.message);
                        } else {
                            console.log("Message sent successfully:", response);
                        }
                    });
                } else {
                    console.error("No active tab found");
                }
            });
        });
    });
});
