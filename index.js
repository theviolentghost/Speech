const http = require("http");
const requestHandler = require("./requestHandler.js");

//require("dotenv").config();

const httpServer = http.createServer((req, res) => {
  console.log("request");
  requestHandler.handleHTTPServer(req,res);
});

httpServer.listen(() => {
  console.log("HTTP server running");
});
httpServer.on("error", (error) => {
  console.error("HTTP server error:", error);
});
httpServer.on("close", () => {
  console.log("HTTP server closed");
});
