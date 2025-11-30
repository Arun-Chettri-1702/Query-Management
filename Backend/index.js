import { initDB } from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const port = process.env.PORT || 8001;

const startServer = async () => {
    await initDB(); // ensures DB exists + initializes pool
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
};

startServer();
