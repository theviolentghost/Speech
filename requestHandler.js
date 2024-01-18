const { RateLimiterMemory } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterMemory({
  points: 15,
  duration: 5, // seconds
});
const url = require('url');
const fs = require('fs');
const api = require('./api.js');

function getContentType(filePath) {
  const contentTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
  };
  const ext = filePath.split('.').pop();
  return contentTypes[ext] || 'application/octet-stream';
}

function sendFile(res, filePath) {
  if (!res) return; 
  fs.readFile(filePath, (error, data) => {
    if (error) {
      //error with file
      if (!fs.existsSync(filePath)) {
        //file doesn't exist
        console.error('File Not Found:', error);
        errorResponse(res, 404);
        return false;
      }

      console.error('File error:', filePath, error);
      errorResponse(res, 500);
      return false;
    }
    //good file, and request
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
    return true;
  });
}
function errorResponse(res, statusCode) {
  if (!res) return; 
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  const filePath = `./error/${statusCode}/index.html`;
  if (!fs.existsSync(filePath)) {
    res.end('Error: ' + statusCode);
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      //error with file
      console.error('Error Response: File error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: Could Not Read File (Error Response File)');
    } else {
      res.end(data);
    }
  });
}

async function handleHTTPServer(req, res) {
  try {
    const method = req.method.toLowerCase();
    switch (method) {
      case "post":
        await handleHTTPServerPost(req, res);
        break;
      case "get":
        await handleHTTPServerGet(req, res);
        break;
      default:
        sendResponse(res, "Invalid request method", {});
    }
  } catch (error) {
    console.error("Error handling HTTP server request:", error);
    sendResponse(res, 500, "Internal Server Error");
  }
}

function sendResponse(res, headerResponse = 400, message, data = {}) {
  res.writeHead(headerResponse, { 'Content-Type': 'application/json' });
  if(!data) {
    res.end(JSON.stringify({ headerResponse, message })); 
    return;
  }
  res.end(JSON.stringify({ headerResponse, message, data }));
}






async function handleHTTPServerGet(req, res) {
  try {
    const urlParts = url.parse(req.url, true);
    const query = urlParts.query;
    const dataID = urlParts.pathname.split('/API/')[1];

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(urlParts.pathname.startsWith("/uploads")){
      var filePath = "." + urlParts.pathname;
    } else {
      var filePath = "./client" + urlParts.pathname;
    }
    //var filePath = "." + urlParts.pathname;


    
    if (filePath.endsWith("/")) {
      filePath += "index.html";
    }
    let requestCompleted = false;
    req.on('error', (err) => {
      console.error('Request error:', err);
      errorResponse(res, 500);//500
    });
    res.on('finish', () => {
      // The response has been successfully completed
      requestCompleted = true;
    });
    req.on('close', () => {
      // Handle client connection closure
      if (!requestCompleted) {
        console.log('Closed Prematurely');
      }
      return;
    });
    sendFile(res, filePath); //send file to client
  } catch (error){
    console.log(`HTTP GET Error: ${error}`);
  }
}
async function handleHTTPServerPost(req, res) {

  await rateLimiter.consume(req.connection.remoteAddress)
    .then(async () => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          // Get url pathname
          const path = url.parse(req.url).pathname; 

          switch (path) {
            case "/API/sendAudio":
              api.processAudio(res, data.audio, data.options, data.isFinal, data.chunkTimeStamp, data.chunkLength, data.chunkSize, data.maxChunkSize);
              break;
            case "/API/sendAudioUrl":
              api.processAudioUrl(res, data.audioUrl, data.options);
              break;
            case "/API/youtubeLink":
              api.processYoutubeLink(res, data.link, data.options);
              break;
            default:
              //invalid enpoint
              sendResponse(res, 400, "Invalid endpoint");
              break;
          }
        } catch (error) {
          console.error("Error parsing request data:", error);
          sendResponse(res, 500, "Server Side Error");
          return; 
        }
      });

    })
    .catch(() => {
      sendResponse(res, 429, "Too Many Requests. Please try again later.");
    });

}

module.exports = {
  handleHTTPServer: handleHTTPServer,
};
