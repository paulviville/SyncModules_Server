import { WebSocketServer } from "ws";
import InstancesRegistry from "./InstancesRegistry.js";

const CLOSING = {
	NORMAL: 1000,
	SHUTDOWN: 1001,
	POLICY_VIOLATION: 1008,
	INTERNAL_ERROR: 1011,
}

const SCOPES = {
	SYSTEM: "SYSTEM",
	INSTANCE: "INSTANCE",
	MODULE: "MODULE",
};

const INSTANCE_COMMANDS = {
	INSTANCE_LIST: "INSTANCE_LIST",
	INSTANCE_ADD: "INSTANCE_ADD",
	INSTANCE_REMOVE: "INSTANCE_REMOVE",
	INSTANCE_JOIN: "INSTANCE_JOIN",
	INSTANCE_LEAVE: "INSTANCE_LEAVE",
}

export default class ServerNetwork {
	#UUID = "00000000-0000-0000-0000-000000000000";
	#server;

	#clients = new Map( ); /// UUID -> socket
	#instancesRegistry = new InstancesRegistry( );
	#onMessageCallbacks = new Map( ); /// Scope -> fn
	#systemCallbacks; // = new Map( ); 

	constructor ( port ) {
		console.log(`ServerNetwork - constructor (${ port })`);
	}

	start ( port ) {
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

		const scope = this.#getScope( message );
		const messageData = JSON.parse( message );
		console.log( messageData );

		this.#onMessageCallbacks.get( scope )?.( message );
	}

	/// placeholder for buffers
	#getScope ( message ) {
		const messageData = JSON.parse( message );
		const { scope } = messageData;
		return scope; 
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

	broadcastPayload ( scope, clientUUIDs, payload ) {
        console.log( `ServerNetwork - broadcastPayload ${ scope } ${ clientUUIDs }` );
		
		const message = this.#createMessage( scope, payload );
		this.#broadcast( clientUUIDs, message );
	}

	#createMessage ( scope, payload ) {
		const messageData = {
			scope,
			senderUUID: this.#UUID,
			payload,
		};

		return JSON.stringify( messageData );
	}

	setOnMessageCallback ( scope, callback ) {
		this.#onMessageCallbacks.set( scope, callback );
	}

	setSystemCallbacks ( callbacks ) {
		this.#systemCallbacks = callbacks;
	}

	/// TEMPORARILY HERE
	// broadcastInstanceList ( clientUUIDs ) {
	// 	const instanceListMessage = this.#createMessage( 
	// 		SCOPES.SYSTEM,
	// 		{
	// 			command: INSTANCE_COMMANDS.INSTANCE_LIST,
	// 			data: {
	// 				instancesList: this.#instancesRegistry.instancesList,
	// 			},
	// 		}
	// 	);
		
	// 	this.#broadcast( clientUUIDs, instanceListMessage );
	// }

	/// 
}

/// MESSAGE : { SENDERUUID, SCOPE, PAYLOAD }