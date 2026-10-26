
const http = require("http");

const server = http.createServer((req, res) => {
    if (req.url === "/") {
        res.end("Hello");
    } else {
        res.statusCode = 404;
        res.end("Page Not Found");
    }
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
