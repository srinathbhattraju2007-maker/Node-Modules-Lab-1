
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to my Express server!");
});

app.get("/about", (req, res) => {
    res.json({
        name: "Srinath Raju",
        section: "CSE GEN AI 304"
    });
});

app.get("/time", (req, res) => {
    res.json({
        time: new Date()
    });
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

app.listen(3000, () => {
    console.log("Express server running on port 3000");
});
