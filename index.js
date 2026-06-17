import ServerManager from "./ServerManager.js";
import ServerNetwork from "./ServerNetwork.js";

const HTTPS = process.argv[1] || false;
const PORT = process.argv[2] || 3000;

// console.log( process.argv )

const args = process.argv.slice( 2 );
console.log( args )

const config = { };
for ( const arg of args ) {
	console.log( arg )
	const argName = arg.split( "=" )[ 0 ];
	const argValue = arg.split( "=" )[ 1 ];
	
	if ( argValue !== undefined )
		config[ argName ] = JSON.parse(argValue);
	else
		console.warn( `WARNING: poorly formatted argument ${ argName }` );
}

// const serverNetwork = new ServerNetwork( PORT );
const serverManager = new ServerManager( );
serverManager.start( config );
