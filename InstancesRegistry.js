const INSTANCE_COMMANDS = {
	INSTANCE_LIST: "INSTANCE_LIST",
	INSTANCE_ADD: "INSTANCE_ADD",
	INSTANCE_REMOVE: "INSTANCE_REMOVE",
	INSTANCE_JOIN: "INSTANCE_JOIN",
	INSTANCE_LEAVE: "INSTANCE_LEAVE",
}


class Instance {
	#UUID;
	#usersUUID = new Set( );
	// #broadcastFn;

	constructor ( UUID ) {
		this.#UUID = UUID;
	}

	addUser ( userUUID ) {
		this.#usersUUID.add( userUUID );
		this.log( );
	}

	removeUser ( userUUID ) {
		this.#usersUUID.delete( userUUID );
		this.log( );
	}

	get users ( ) {
		return [ ...this.#usersUUID.keys( ) ];
	}

	log ( ) {
		console.log( `instance ${ this.#UUID } - ${ [ ...this.#usersUUID.keys( ) ] }`)
	}
}

export default class InstancesRegistry {
	#instances = new Map( ); /// UUID -> Instance
	#users = new Map( ); /// UUID -> Instance
	#outputFn;

	#commandCallbacks = {
		// [INSTANCE_COMMANDS.INSTANCE_LIST]: ( data ) => {
			/// only an outgoing command ?
		// },
		[INSTANCE_COMMANDS.INSTANCE_ADD]: ( data ) => {
			this.addInstance( data.instanceUUID );
			this.output( INSTANCE_COMMANDS.INSTANCE_LIST, this.instancesList );
		},
		[INSTANCE_COMMANDS.INSTANCE_REMOVE]: ( data ) => {
			this.removeInstance( data.instanceUUID );
			this.output( INSTANCE_COMMANDS.INSTANCE_LIST, this.instancesList );
		},
		[INSTANCE_COMMANDS.INSTANCE_JOIN]: ( data ) => {
			this.joinInstance( data.instanceUUID, data.userUUID );
		},
		[INSTANCE_COMMANDS.INSTANCE_LEAVE]: ( data ) => {
			this.leaveInstance( data.instanceUUID, data.userUUID );
		},
	}

	constructor ( ) {
        console.log( `InstancesRegistry - constructor` );
	}

	setOutputFn ( outputFn ) {
		this.#outputFn = outputFn;
	}

	addInstance ( instanceUUID ) {
        console.log( `InstancesRegistry - addInstance ${ instanceUUID }` );

		this.#instances.set( instanceUUID, new Instance( instanceUUID ) );
	}

	removeInstance ( instanceUUID ) {
        console.log( `InstancesRegistry - removeInstance ${ instanceUUID }` );
		
		this.#instances.delete( instanceUUID, new Instance( instanceUUID ) );
	}

	joinInstance ( instanceUUID, userUUID ) {
        console.log( `InstancesRegistry - joinInstance ${ instanceUUID } ${ userUUID }` );
		
		const instance = this.#instances.get( instanceUUID );
		this.#users.set( userUUID, instance );
		instance.addUser( userUUID );
	}

	leaveInstance ( instanceUUID, userUUID ) {
        console.log( `InstancesRegistry - leaveInstance ${ instanceUUID } ${ userUUID }` );
		
		const instance = this.#instances.get( instanceUUID );
		this.#users.set( userUUID, undefined );
		instance.removeUser( userUUID );
	}

	addUser ( userUUID ) {
		this.#users.set( userUUID, undefined );
		this.output( INSTANCE_COMMANDS.INSTANCE_LIST, this.instancesList, [ userUUID ] );
	}

	removeUser ( userUUID ) {
		this.#users.delete( userUUID );
	}

	instanceUsers ( instanceUUID ) {
        console.log( `InstancesRegistry - instanceUsers ${ instanceUUID }` );

		const instance = this.#instances.get( instanceUUID );
		return instance.users;
	}

	get instancesList ( ) {
		return [ ...this.#instances.keys( ) ];
	}

	input ( payload ) {
		const { command, data } = payload;

		const callback = this.#commandCallbacks[ command ];
		if ( callback !== undefined ) {
			callback( data );
		}
		else {
			console.warn( `InstancesRegistry  - has no handler for ${ command }`);
		}
	}

	output ( command, data, usersUUID = [ ...this.#users.keys( ) ] ) {
        console.log( `InstancesRegistry - output` );
		const payload = { command, data };
		console.log(usersUUID)
		this.#outputFn?.( usersUUID, payload );
	}
}