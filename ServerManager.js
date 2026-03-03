import InstancesRegistry from "./InstancesRegistry.js";
import ServerNetwork from "./ServerNetwork.js";

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

export default class ServerManager {
	#UUID = "00000000-0000-0000-0000-000000000000"; // magic value for the server
	
	#serverNetwork = new ServerNetwork( );
	#instancesRegistry = new InstancesRegistry( );
	#users = new Set( ); /// UUID;

	constructor ( ) {
		console.log(`ServerManager - constructor`);

		this.#instancesRegistry.setOutputFn( this.#serverNetwork.broadcastPayload.bind( this.#serverNetwork, SCOPES.SYSTEM ) );

		this.#serverNetwork.setSystemCallbacks( {
			onNewClient: ( userUUID ) => { 
				this.#users.add( userUUID );
				this.#instancesRegistry.addUser( userUUID );
			}, 
			onClose: ( userUUID ) => {
				this.#users.delete( userUUID );
				this.#instancesRegistry.removeUser( userUUID );
			}, 
		} );

		this.#serverNetwork.setOnMessageCallback( SCOPES.SYSTEM, ( message ) => {
			const messageData = JSON.parse( message );
			console.log( `onMessage ${ SCOPES.SYSTEM }`, messageData );
			const { payload } = messageData;

			// switch ( command ) {
			// 	case INSTANCE_COMMANDS.INSTANCE_ADD:
			// 		this.#instancesRegistry.addInstance( data.instanceUUID );
			// 		this.#serverNetwork.broadcastInstanceList( [ ...this.#users.keys( ) ] );
			// 		break;
			// 	case INSTANCE_COMMANDS.INSTANCE_REMOVE:
			// 		this.#instancesRegistry.removeInstance( data.instanceUUID );
			// 		this.#serverNetwork.broadcastInstanceList( [ ...this.#users.keys( ) ] );
			// 		break;
			// 	case INSTANCE_COMMANDS.INSTANCE_JOIN:
			// 		this.#instancesRegistry.joinInstance( data.instanceUUID, data.userUUID );
			// 		break;
			// 	case INSTANCE_COMMANDS.INSTANCE_LEAVE:
			// 		this.#instancesRegistry.leaveInstance( data.instanceUUID, data.userUUID );
			// 		break;
			// 	default:
			// 		console.log( `unknown command ${ command }` );
			// }

			this.#instancesRegistry.input( payload );
		} );
	}

	start ( port ) {
		this.#serverNetwork.start( port );
	}
}