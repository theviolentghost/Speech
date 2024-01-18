const fs = require('fs');
const { v4: generateID } = require('uuid');
const { AssemblyAI } = require('assemblyai');
import("node-fetch");

const client = new AssemblyAI({
  apiKey: "6dbc338a04544f18bd138e5b923c964b"
});

function generateRandomString() {
  return generateID();
}

function sendResponse(res, headerResponse = 400, message, data = {}) {
  res.writeHead(headerResponse, { 'Content-Type': 'application/json' });
  if(!data) {
    res.end(JSON.stringify({ headerResponse, message })); 
    return;
  }
  res.end(JSON.stringify({ headerResponse, message, data }));
}




async function processAudio(res, base64AudioString = "", options = {}, isFinal = false, chunkTimeStamp = 0, chunkLength = 15000, chunkSize = 5000, maxChunkSize = 15000) {
  let filePath = await saveAudioAsFile(base64AudioString);
  if (filePath) {
    const result = await audioToText(filePath, options, true);
    //console.log(result);
    if (result && result.status !== "error") {
      result.chunkTimeStamp = chunkTimeStamp;
      result.chunkLength = chunkLength;
      result.chunkSize = chunkSize;
      result.maxChunkSize = maxChunkSize;
      result.isFinal = isFinal;
      sendResponse(res, 200, "Successfully processed audio", result);
      deleteFile(filePath);
      return;
    }
  }
  deleteFile(filePath);
  sendResponse(res, 400, "Error saving audio file");
}

async function saveAudioAsFile(base64AudioString) {
  try {
    const buffer = Buffer.from(base64AudioString, 'base64');

    const fileName = `audio_${generateRandomString()}.mp3`;
    const filePath = `uploads/${fileName}`;

    return new Promise((resolve, reject) => {  
      fs.writeFile(filePath, buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(filePath);
        }
      });
    });
  } catch (error) {
    console.error('Error decoding base64 string:', error);
  }
}

async function deleteFile(filePath) {
  try {
    if(!filePath) return;
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error('Error deleting file:', error);
        return;
      }
      //console.log('File deleted successfully!');
    });
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

async function audioToText(filePath, config, useBaseUrl = false) {
  //work to be done
  try {
    const baseUrl = "https://8ef83af0-0985-4484-b415-1e78c1f88abe-00-1mdmz7b17u4z9.riker.replit.dev/";
    const audioUrl = useBaseUrl ? baseUrl + filePath : filePath;
    
    const baseConfig = {
      audio: audioUrl,
    };
    const configurations = {
      ...baseConfig, 
      ...config
    };
    const convert = async () => {
      const result = await client.transcripts.transcribe(configurations);// transscript
      return result;
    }
    return await convert();
  } catch (error) {
    console.error('Error converting audio to text:', error);
  }
}

async function processAudioUrl (res, url = "", options = {}) {
  let result = await audioToText(url, options);
  if (result && result.status !== "error") {
    sendResponse(res, 200, "Successfully processed audio", result);
    return;
  }
  sendResponse(res, 400, "Error processing audio file");
}

function getYouTubeId (url) {
  if (url.includes('v=') || url.includes('youtu.be')) { 
    const splitUrl = url.split(/(?:v=|\/v\/|youtu\.be\/|embed\/)/);
    return splitUrl[splitUrl.length -1].split(/[?&]/)[0];
  }
  return url; //base case
};

async function processYoutubeLink(res, youtubeLink, ) {
  if(!youtubeLink) sendResponse(res, 429, "No youtube ID provided");
  youtubeLink = getYouTubeId(youtubeLink);
  if(youtubeLink.length <= 10 || youtubeLink.length >= 12) sendResponse(res, 429, "Youtube Link is not real");
  try {
    const response = await fetch(`https://youtube-search-and-download.p.rapidapi.com/video?id=${getYouTubeId(youtubeLink) || "dQw4w9WgXcQ"}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '86e181cf62mshe81e98a2581da09p155f16jsn0578b6eb021b',
        'X-RapidAPI-Host': 'youtube-search-and-download.p.rapidapi.com'
      }
    });
    const result = await response.json();
    if(result.streamingData) {
      const url = result.streamingData.formats[0].url;
      //console.log(url);
      processAudioUrl(res, url, {});
      return;
    }
    sendResponse(res, 400, "Error processing Youtube Link");
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  processAudio: processAudio,
  processAudioUrl: processAudioUrl,
  processYoutubeLink: processYoutubeLink
}
