
import chalk from 'chalk'
import { PARSE } from 'ho-conformance-events'
import Logger from 'ho-conformance-logger'


function capitalise( str ) {
    if ( str.length < 1 ) {
        throw new Error( 'can not capitalise empty string' )
    }
    return str.replace( /(^.)/, function( cap ) { return cap.toUpperCase() } )
}


/**
 * Base conformance listener/task class
 * @class
 */
export default class ConformanceBase {
    /**
     * @constructs
     */
    constructor() {
        this.taskName = 'Base'
        this.runner = null
    }

    /**
     * initialises the object
     * should be called by children after their props have been applied
     */
    init() {
        this._bindHandlers()
    }

    /**
     * Attaches the logger once the runner has been passed in
     * Called during install phase
     * @private
     */
    _attachLogger() {
        Object.getOwnPropertyNames( Logger.prototype ).forEach( method => {
            // Bail on constructor function and any privates (denoted with _ prefix)
            if ( method === 'constructor' || /^_/.test( method ) ) {
                return
            }

            try {
                if ( this.__proto__[ method ] ) {
                    console.error( 'Error attaching logging function to conformance task base prototype :: ' + method )
                    return
                }
            } catch( err ) {
                console.error( 'Error accessing conformance base prototype :: attachLogger() :: ' + err )
            }

            try {
                if ( !this.runner[ method ] ) {
                    console.error( 'Log method not found on conformance task runner :: ' + method )
                    return
                }
            } catch( err ) {
                console.error( 'Error accessing this.runner from conformance base :: ' + err )
            }


            this.__proto__[ method ] = function() {
                this.runner[ method ]( ...[ chalk.grey( '[' + this.taskName + ']' ) ].concat( ...arguments ) )
            }
        })
    }

    /**
     * _bindHandlers
     * any methods prefixed with `on` will be bound up
     * @private
     */
    _bindHandlers() {
        this._getHandlers = this._getHandlers.bind( this )
        this._getHandlers().forEach( handler => {
            this[ handler ] = this[ handler ].bind( this )
        })
    }

    /**
     * _getHandlers
     * gets any `on` prefixed methods from the class
     * @private
     */
    _getHandlers() {
        return Object.getOwnPropertyNames( this.__proto__ )
            .filter( key => {
                return /^on/.test( key )
            })
    }

    /**
     * Install hook
     * Fired with a few options when the task is registered
     */
    install( opts ) {
        if ( !opts || !opts.runner ) {
            throw new Error( 'Install should pass an instance of the conformance runner' )
        }

        this.runner = opts.runner;

        // Try to attach basic parse events
        // e.g. this.runner.on( PARSE.RULE, this.onRule )
        var method
        Object.keys( PARSE ).forEach( type => {
            method = 'on' + capitalise( type.toLowerCase() )
            // Abstract noop should mean this never throws
            if ( !this[ method ] ) {
                throw new Error( method + ' must be on plugin :: [' + this.taskName + ']' )
            }

            this.runner.on( PARSE[ type ], this[ method ] )
        })

        // Try to attach the logger now the runner is here
        this._attachLogger()
    }

    /**
     * destroy hook
     * Fired when the conformance runner is finished with the task
     */
    destroy() {
        var method
        Object.keys( PARSE ).forEach( type => {
            method = 'on' + capitalise( type.toLowerCase() )
            this.runner.off( PARSE[ type ], this[ method ] )
        })

        this.runner = null;
    }

    // log() {
    //     this.runner.log( ...[ chalk.grey( '[' + this.taskName + ']' ) ].concat( ...arguments ) )
    // }


    /*-----------------------------------------------------------*\
     *
     *  Listeners
     *
    \*-----------------------------------------------------------*/

    onRoot( root ) {}

    onRule( rule ) {}

    onRuleset( rule ) {}

    onSelector( selector ) {}

    onSelectors( selectors ) {}

    onVariable( variable ) {}

    onImport( importRule ) {}

    onComment( comment ) {}

    onMixin( mixin ) {}

    onMixin_definition( mixinDef ) {}

    onMixin_call( mixinCall ) {}

    onMedia( media ) {}

    onNot_recognised( node ) {}
}
