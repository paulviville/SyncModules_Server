import InstancesRegistry from "./InstancesRegistry.js";
import ServerNetwork from "./ServerNetwork.js";

const SCOPES = {
	SYSTEM: "SYSTEM",
	INSTANCE: "INSTANCE",
	// MESSAGE: "MESSAGE",
	MODULE: "MODULE",
};

export default class ServerManager {
	#UUID = "00000000-0000-0000-0000-000000000000"; // magic value for the server
	
	#serverNetwork = new ServerNetwork( );
	#instancesRegistry = new InstancesRegistry( );
	#users = new Set( ); /// UUID;
	#broadcastFn;

	constructor ( ) {
		console.log(`ServerManager - constructor`);

		this.#broadcastFn = this.#serverNetwork.broadcast;
		this.#instancesRegistry.setOutputFn( ( clientUUIDs, payload ) => {
			const message = this.#createMessage( SCOPES.SYSTEM, payload );
			this.#broadcastFn( clientUUIDs, message );
		} );

		this.#instancesRegistry.setInstanceOutputFn( ( clientUUIDs, payload ) => {
			const message = this.#createMessage( SCOPES.MODULE, payload );
			this.#broadcastFn( clientUUIDs, message );
			// console.log(clientUUIDs, message)
		} );

		this.#serverNetwork.setSystemCallbacks( {
			onNewClient: ( userUUID ) => { 
				this.#users.add( userUUID );
				this.#instancesRegistry.addUser( userUUID );
			}, 
			onClose: ( userUUID ) => {
				console.log("on close")
				this.#users.delete( userUUID );
				this.#instancesRegistry.removeUser( userUUID );
			},
			onMessage: ( message ) => {
				const messageData = JSON.parse( message );
				// console.log( `onMessage ${ messageData.scope }`, messageData );
				// console.log(messageData)
				const { scope, senderUUID, payload } = messageData;
				// console.log( scope, senderUUID, payload)
				/// REPLACE WITH ROUTING FUNCTIONS
				switch ( scope ) {
					case SCOPES.SYSTEM:
						this.#instancesRegistry.input( payload );
						break;
					case SCOPES.MODULE:
						// console.log(payload)
						this.#onModuleMessage( senderUUID, payload );
						break;
				}
				///
			},
		} );

		/// Debug
		this.#instancesRegistry.addInstance( "00000000-0000-0000-0000-000000000000");
		///
	}

	start ( port ) {
		this.#serverNetwork.start( port );
	}

	#createMessage ( scope, payload, senderUUID = this.#UUID ) {
		const messageData = {
			scope,
			senderUUID,
			payload,
		};

		return JSON.stringify( messageData );
	}

	#onModuleMessage ( senderUUID, payload ) {
		// console.log(senderUUID, payload)

		const instance = this.#instancesRegistry.userInstance( senderUUID );
		// console.log( `target instance ${ instance?.log() }`)
		if ( instance !== undefined ) {
			console.log(`routing to instance ${ instance.UUID }`);
			
			instance.input( payload );
			
			/// transfer message to instance users
			const message = this.#createMessage( SCOPES.MODULE, payload, senderUUID );
			const targetUUIDs = instance.users.filter( userUUID => userUUID != senderUUID );
			this.#broadcastFn( targetUUIDs, message );
		}
	}

	// #onSystemMessage ( ) {

	// }
}



/// MESSAGE : { SENDERUUID, SCOPE, PAYLOAD }
/// PAYLOAD : { MODULEUUID, COMMAND, DATA }
/// COMMAND: string || uint
/// DATA: COMMAND dependent