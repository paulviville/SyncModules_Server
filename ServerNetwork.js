import { WebSocketServer } from "ws";


export default class ServerNetwork {
	#uuid = "00000000-0000-0000-0000-000000000000";
	#server;

	#sockets = new Set( );

	constructor ( port ) {
		console.log(`ServerNetwork - constructor (${ port })`);
		this.#server = new WebSocketServer({ port: port });

		this.#server.on('connection', ( socket ) => {
			this.#handleConnection( socket );
		});

		process.on('SIGINT', ( ) => { this.#handleShutdown( ); })
		process.on('SIGTERM', ( ) => { this.#handleShutdown( ); })

	}

	#handleConnection ( socket ) {
        console.log(`ServerNetwork - #handleConnection`);

		this.#sockets.add( socket );
		socket.once( 'message', ( message ) => this.#handleIdentification( socket, message ) );


	}

	#handleIdentification ( socket, message ) {
        console.log(`ServerNetwork - #handleIdentification`);

		const data = JSON.parse( message );
		console.log("identification message: ", data);


		this.#sockets.delete( socket );
		socket.terminate( );

	}

	#handleMessage ( clientUUID, message ) {
        console.log(`ServerNetwork - #handleMessage ${ clientUUID }`);

		const messageData = JSON.parse( message );
		console.log( messageData );
	}

	#handleNewClient ( clientUUID ) {
        console.log(`ServerNetwork - #handleNewClient ${ clientUUID }`);

	}


	#handleClose( clientUUID ) {
        console.log(`ServerNetwork - #handleClose ${ clientUUID }`);

	}

	#handleShutdown ( ) {
        console.log(`ServerNetwork - #handleShutdown`);

		this.#sockets.forEach( ( socket ) => {
			socket.terminate( );
		} );

		this.#server.close();
	}

	#broadcast ( clientUUIDs, message ) {
        console.log(`ServerNetwork - #broadcast ${ clientUUIDs }`);

	}

	#send ( clientUUID, message ) {
        console.log(`ServerNetwork - #send ${ clientUUID }`);

	}
}