import { WebSocketServer } from "ws";

const CLOSING = {
	NORMAL: 1000,
	SHUTDOWN: 1001,
	POLICY_VIOLATION: 1008,
	INTERNAL_ERROR: 1011,
}

export default class ServerNetwork {
	#server;

	#clients = new Map( ); /// UUID -> socket
	#systemCallbacks;

	constructor ( ) {
		console.log(`ServerNetwork - constructor`);
	}

	start ( port ) {
		console.log(`ServerNetwork - start ${ port }`);

		this.#server = new WebSocketServer({ port: port });

		this.#server.on('connection', ( socket ) => {
			this.#handleConnection( socket );
		});

		process.on('SIGINT', ( ) => { this.#handleShutdown( ); })
		process.on('SIGTERM', ( ) => { this.#handleShutdown( ); })
	}

	#handleConnection ( socket ) {
        console.log(`ServerNetwork - #handleConnection`);

		socket.once( 'message', ( message ) => this.#handleIdentification( socket, message ) );
	}

	#handleIdentification ( socket, message ) {
        console.log(`ServerNetwork - #handleIdentification`);

		const data = JSON.parse( message );
		console.log("identification message: ", data);

		const { UUID } = data;
		if ( UUID !== undefined ) {
			console.log( "Client identifyied" );
			this.#clients.set( UUID, socket );
			this.#handleNewClient( UUID );
			socket.on( "message", ( message ) => this.#handleMessage( UUID, message ) );
			socket.on( "close", ( ) => this.#handleClose( UUID ) );
		} else {
			console.log( "Client failed to identify" );
			socket.close( CLOSING.POLICY_VIOLATION, "Identification required { UUID }" );
		}
	}

	#handleMessage ( clientUUID, message ) {
        console.log(`ServerNetwork - #handleMessage ${ clientUUID }`);

		this.#systemCallbacks?.onMessage( message );
	}

	#handleNewClient ( clientUUID ) {
        console.log(`ServerNetwork - #handleNewClient ${ clientUUID }`);

		this.#systemCallbacks?.onNewClient( clientUUID );
	}

	#handleClose( clientUUID ) {
        console.log(`ServerNetwork - #handleClose ${ clientUUID }`);

		this.#clients.delete( clientUUID );
		this.#systemCallbacks?.onClose( clientUUID );
	}

	#handleShutdown ( ) {
        console.log(`ServerNetwork - #handleShutdown`);

		this.#server.clients.forEach( ( client ) => {
			client.close( CLOSING.SHUTDOWN, "Server shutting down" );
		} );

		this.#server.close( );
	}

	#send ( clientUUID, message ) {
        console.log( `ServerNetwork - #send ${ clientUUID }` );

		const client = this.#clients.get( clientUUID );
		client.send( message );
	}

	#broadcast ( clientUUIDs, message ) {
        console.log( `ServerNetwork - #broadcast ${ clientUUIDs }` );

		for ( const clientUUID of clientUUIDs ) {
			this.#send( clientUUID, message );
		}
	}
	
	get broadcast ( ) {
		return this.#broadcast.bind( this );
	}

	setSystemCallbacks ( callbacks ) {
		this.#systemCallbacks = callbacks;
	}
}

/// MESSAGE : { HEADER, PAYLOAD }
/// HEADER : { SENDERUUID, SCOPE }
/// PAYLOAD : { MODULEUUID, COMMAND, DATA }
/// COMMAND: string || uint
/// DATA: COMMAND dependent

/// Bufferized
/// HEADER : [ UUID: 16 bytes, SCOPE: 4 bytes ]
/// PAYLOAD : [ COMMAND: 4 bytes, DATA: (4 bytes + size(DATA)) ]
/// DATA: [ SIZE, ... ]
