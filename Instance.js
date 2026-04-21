import ModulesRegistry from "./SyncModules/Core/ModulesRegistry.js";

export default class Instance {
	#UUID;
	#usersUUID = new Set( );
	#outputFn;
	#moduleRegistry;

	constructor ( UUID ) {
		this.#UUID = UUID;
		
		this.#moduleRegistry = new ModulesRegistry( ( payload ) => {
			console.log("module registry output")
			this.output( this.users, payload );
		} );
	}

	setOutputFn ( outputFn ) {
		this.#outputFn = outputFn;
	}

	addUser ( userUUID ) {
		this.#usersUUID.add( userUUID );
		this.log( );

		this.outputState( userUUID );
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

	get UUID ( ) {
		return this.#UUID;
	}

	input ( payload ) {
        console.log( `Instance - input` );
		const { moduleUUID, command, data } = payload;
		
		console.log( moduleUUID, command );

		const module = this.#moduleRegistry.getModule( moduleUUID );
		module.input( payload );
	}

	output ( userUUIDs, payload ) {
        console.log( `Instance - output` );
		
		this.#outputFn?.( userUUIDs, payload );
	}

	outputState ( userUUID ) {
        console.log( `Instance - outputState` );
		
		const registryState = this.#moduleRegistry.outputState( );

		this.output( [ userUUID ], registryState );

		for ( const [ moduleUUID, module ] of this.#moduleRegistry.modules ) {
			if ( module.type == this.#moduleRegistry.type ) 
				continue;

			const moduleState = module.outputState( );
			this.output( [ userUUID ], moduleState );
		}
	}
}