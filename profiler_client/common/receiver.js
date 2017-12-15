// local modules
const utils = require('./utils');

// community modules
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

// module level variables
let server_mode = null;
let logger = null;
let profiler_screen = null;
let query_store = null;

const GUI_MODE = 'gui'
const CONSOLE_MODE = 'console'

function ReceiverServer() {
    this.start = function(mode) {
        server_mode = mode;
        query_store = new utils.QueryStore();

        if (mode === GUI_MODE) {
            profiler_screen = new utils.ProfilerScreen();
            profiler_screen.setup(query_store);
        } else if (mode === CONSOLE_MODE) {
            logger = new utils.ConsoleLogger();
        }

        server.on('error', function(error) {
            utils.logger.loggerError(`server error:\n${error}`);
            server.close();
        });

        server.on('message', function(incoming_message, message_info) {
            const payload = JSON.parse(incoming_message);

            query_store.addQuery(
                payload.orm_model_name,
                payload.orm_database_name,
                payload.source_snippet_location,
                payload.source_snippet,
                payload.source_snippet_context,
                payload.sql,
                payload.frame_exception
            );

            if (mode === CONSOLE_MODE){
                logger.logQueryToConsole(
                    payload.orm_model_name,
                    payload.orm_database_name,
                    payload.source_snippet_location,
                    payload.source_snippet,
                    payload.sql,
                    payload.frame_exception
                );
            } else if (mode === GUI_MODE) {
                profiler_screen.updateWithQueries(query_store);
            }
        });

        server.on('listening', function() {
            if (server_mode === CONSOLE_MODE) {
                logger.logSuccess(`listening on: ${utils.config.telemetry_host}: ${utils.config.telemetry_port}`);
            }
        });

        server.bind(
            utils.config.telemetry_port,
            utils.config.telemetry_host
        );
    }
}

module.exports = {
    server: new ReceiverServer()
}
