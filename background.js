chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.audioBlobUrl) {
        transcribeAudio(message.audioBlobUrl)
            .then(transcription => {
                chrome.tabs.sendMessage(sender.tab.id, { transcription });
            })
            .catch(error => {
                console.error("Error during transcription:", error);
            });
    }
});

async function transcribeAudio(audioBlobUrl) {
    try {
        const response = await fetch('YOUR_TRANSCRIPTION_API_ENDPOINT', {
            method: 'POST',
            body: JSON.stringify({ audioUrl: audioBlobUrl }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data.transcription;
    } catch (error) {
        console.error("Error in transcribing audio:", error);
        throw error;
    }
}
