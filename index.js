import ServerManager from "./ServerManager.js";
import ServerNetwork from "./ServerNetwork.js";


const args = process.argv.slice( 2 );

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

config.port ??= 3000;
config.https ??= false;

// const serverNetwork = new ServerNetwork( PORT );
const serverManager = new ServerManager( );
serverManager.start( config );
