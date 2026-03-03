import ServerManager from "./ServerManager.js";
import ServerNetwork from "./ServerNetwork.js";

const PORT = process.argv[2] || 3000;

// const serverNetwork = new ServerNetwork( PORT );
const serverManager = new ServerManager( );
serverManager.start( PORT );
