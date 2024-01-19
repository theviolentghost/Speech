function sendAudioToApi(
  base64Audio = "",
  options = {},
  isFinal = false,
  timeStamp = 0,
  chunkLength = 15000,
  chunkSize = 5000,
  maxChunkSize = 15000,
) {
  if (!base64Audio) return;
  fetch("../API/sendAudio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio: base64Audio,
      options: options,
      chunkTimeStamp: timeStamp,
      chunkLength: chunkLength,
      chunkSize: chunkSize,
      maxChunkSize: maxChunkSize,
      isFinal: isFinal,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const transcript = data.data; //get the results from api
      const text = transcript.text;
      //console.log(text)

      if (transcript.isFinal) transcriptor.onFinal(transcript);

      transcriptor.combineTranscription(
        transcript,
        transcript.chunkTimeStamp,
        transcript.chunkLength,
        transcript.chunkSize,
        transcript.maxChunkSize,
      );
      transcriptor.displayTranscript();
      //audioData.importTranscriptData(transcript.words, transcript.chunkTimeStamp, transcript.chunkLength, transcript.chunkSize);
      //audioData.displayTranscript();
    })
    .catch((error) => {
      console.log("server", error);
    });
}
function sendAudioUrlToApi(audioUrl) {
  //mp3
  if(!audioUrl) return;
  fetch("../API/sendAudioUrl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audioUrl: audioUrl,
      options: {},
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.log(error);
    });
}
