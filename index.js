const http = require("http");
const requestHandler = require("./requestHandler.js");

const port = process.env.PORT || 3000;

const httpServer = http.createServer((req, res) => {
  console.log("request");
  requestHandler.handleHTTPServer(req,res);
});

httpServer.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});
httpServer.on("error", (error) => {
  console.error("HTTP server error:", error);
});
httpServer.on("close", () => {
  console.log("HTTP server closed");
});
