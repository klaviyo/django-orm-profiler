// community modules
const terminal        = require('terminal-kit').terminal;
const yaml            = require('js-yaml');
const fs              = require('fs');
const homedir         = require('homedir');
const _               = require('underscore');
const blessed         = require('blessed');
const blessed_contrib = require('blessed-contrib');
const short_hash      = require('short-hash');

// local modules
const package_json = require('../../package.json');

// constants
const DEFAULT_STYLES = {
    fg: '#24ce78',
    bg: 'black',
    border: {
        fg: '#24ce78',
        bg: 'black'
    }
}

function ProfilerScreen(query_store) {
    this.setup = function(query_store) {
        const instance = this;
        instance.query_store = query_store;
        instance.main_table.focus();

        // set up the information displayed in the header of the profiler
        instance.header_log.log(`  ${package_json.description}`);
        instance.header_log.log(`  version: ${package_json.version}\n  listening on: ${config.telemetry_host}:${config.telemetry_port}`);
        instance.header_log.log(`  \`c\` to clear log, \`p\` to save to disk`);

        // bind events to stop the tool
        instance.main_screen.key(['escape', 'q', 'C-c'], function(ch, key) {
            return process.exit(0);
        });

        // bind the clear event
        instance.main_screen.key(['c'], function(ch, key) {
            // bust out the queries
            instance.query_store.queries = {};
            // bust out the table data
            instance.main_table.setData({
                headers: instance.main_table_header,
                data: []
            })
            // bust out the detail log
            instance.clearDetailLog();
            instance.flashNotifcation('Cleared all recorded queries!', instance)
        });

        // bind the log to file event
        instance.main_screen.key(['p'], function(ch, key) {
            const fs = require('fs');
            let file_string = '';
            _.map(instance.query_store.queries, function(values, key) {
                file_string += values.model_name + '|'
                file_string += values.database_name + '|'
                file_string += values.snippet_location + '|'
                file_string += values.count + '|'
                file_string += values.snippet + '|'
                file_string += values.sql.toString().replace('\n', '') + '|'
                file_string += '\n'
            });

            const now = new Date();
            const file_name = `/tmp/django-orm-profile-snapshot-${now.getTime()}.log`;

            fs.writeFile(file_name, file_string, function(error) {
                if (error) {
                    instance.flashNotifcation(error);
                }

                instance.flashNotifcation(`The file was saved to ${file_name}!`);
            });
        });

        // bind the query detail trigger event (pressing enter on a query row)
        instance.main_table.rows.on('select', function(row) {
            // split out the row and combine the model / connection name to use
            // to look up the query details in the query store
            if (row) {
                const split_row = row.content.split(/[ ]+/);
                const query_details_key = split_row[0];
                const query_details = instance.query_store.queries[query_details_key];
                const snippet = '';
                const query_detail_lines = [];

                // if we've found details for this query, build an array where
                // each item is a line for the detail section display
                if (query_details) {
                    query_detail_lines.push('');
                    query_detail_lines.push(`    snippet: ${String(query_details.snippet)}`);
                    query_detail_lines.push(`   location: ${String(query_details.snippet_location)}`);
                    query_detail_lines.push('   context: ');
                    for (const context of query_details.snippet_context) {
                        query_detail_lines.push(`            ${context}`);
                    };
                }

                if (query_details.sql) {
                    query_detail_lines.push('        SQL:');
                    const sql = String(query_details.sql);
                    // split the long string of SQL into lines that match the width
                    // of our terminal
                    const wrap_length = instance.main_screen.width;
                    let start_pos = 0;
                    for (let i = 0; i < query_details.sql.length / wrap_length; i++) {
                        query_detail_lines.push(`   ${query_details.sql.toString().substring(start_pos, start_pos + wrap_length)}`);
                        start_pos += wrap_length;
                    }
                }

                // add the detail lines to the detail section display
                instance.main_log.setItems(query_detail_lines);
                instance.main_log.scrollTo(0);
            }
        });

        // initialize the table with headers
        instance.main_table.setData({
            headers: instance.main_table_header,
            data: []
        });

        // render out the first empty tool screen
        instance.main_screen.render();
    },

    // initialize top level screen and grid for widgets
    this.main_screen = blessed.screen(),
    this.main_grid = new blessed_contrib.grid({
        rows: 12,
        cols: 12,
        screen: this.main_screen
    }),

    // initialize `django-orm-profiler` header widget
    this.header_log = this.main_grid.set(0, 0, 2, 8, blessed_contrib.log, {
        label: 'django-orm-profiler',
        style: {
            fg: 'white',
            bg: 'black',
            border: {
                fg: '#24ce78',
                bg: 'black'
            }
        }
    }),

    this.notification_log = this.main_grid.set(0, 8, 2, 4, blessed_contrib.log, {
        label: 'notifications',
        style: DEFAULT_STYLES
    }),

    // initialize `query-list` table widget
    this.main_table = this.main_grid.set(2, 0, 6, 12, blessed_contrib.table, {
        keys:          true,
        interactive:   true,
        label:         'query-list',
        border:        {},
        columnSpacing: 10,
        columnWidth:   [15, 11, 30, 25, 10],
        fg: '#24ce78',
        bg: 'black',
        style: {
            fg: 'white',
            border: {
                fg: '#24ce78'
            }
        }
    }),

    // initialize `query-detail` log widget
    this.main_log = this.main_grid.set(8, 0, 4, 12, blessed_contrib.log, {
        label: 'query-detail',
        style: DEFAULT_STYLES
    }),

    // static header column names
    this.main_table_header = [
        'query-key',
        'query-count',
        'table-name',
        'connection-name',
        'query-type'
    ],

    // updates the table with current queries, called everytime a new query is added
    // to the query store
    this.updateWithQueries = function() {
        // reformat the queries as they are stored in the store into a simple array
        // of items for display
        const query_list_items = _.map(this.query_store.queries, function(query_data, query_key) {
            return [
                query_key,
                query_data.count,
                query_data.model_name,
                query_data.database_name,
                query_data.sql.toString().split(' ')[0]
            ];
        });

        // add the query items to the table display, sorting them by the django
        // model that they belong to
        this.main_table.setData({
            headers: this.main_table_header,
            data: _.sortBy(query_list_items, function(item) {
                return item[2];
            })
        });
        this.main_screen.render();
    },

    this.flashNotifcation = function(message) {
        this.notification_log.setItems([` ${message}`]);
        this.notification_log.scrollTo(0);
    },

    // clear out the `query-detail` log
    this.clearDetailLog = function() {
        this.main_log.setItems([]);
        this.main_log.scrollTo(0);
    }
};

function QueryStore() {
    this.queries = {},

    this.addQuery = function (model_name, database_name, snippet_location, snippet, snippet_context, sql, frame_exception) {
        // for this case we've already stored this query and just want to increment the occurance
        if (this.queries[this.queryKey(model_name, database_name, snippet_location)]) {
            this.queries[this.queryKey(model_name, database_name, snippet_location)].count += 1;
        // for this case we surfaced some exception trying to pull query info out of
        // django
        } else if (frame_exception) {
            this.queries[this.queryKey(model_name, database_name, snippet_location)] = {
                model_name: 'frame_exception',
                database_name: 'frame_exception',
                snippet_location: 'N/A',
                sql: 'N/A',
                snippet: frame_exception,
                snippet_context: 'N/A',
                count: 1
            };
        // for this case we have not saved this type of query before, so save it
        // with all its detail
        } else {
            this.queries[this.queryKey(model_name, database_name, snippet_location)] = {
                model_name: model_name,
                database_name: database_name,
                snippet_location: snippet_location,
                sql: sql,
                snippet: snippet,
                snippet_context: snippet_context,
                count: 1
            };
        }
    },

    this.getQueries = function() {
        return this.queries;
    },

    this.queryKey = function(model_name, database_name, snippet_location) {
        return short_hash(`${database_name}:${model_name}:${snippet_location}`);
    }
}

function ConsoleLogger() {
    this.mergeStrings = function() {
        const args = [...arguments];
        return args.join(' ');
    }
    this.log = function(func, args) {
        func(`[django-orm-profiler] ${this.mergeStrings.apply(null, args)}\n`);
    }
    this.logInfo = function() {
        this.log(terminal.defaultColor, arguments);
    },
    this.logWarn = function(message) {
        this.log(terminal.yellow, arguments);
    },
    this.logError = function(message) {
        this.log(terminal.brightRed, arguments);
    },
    this.logSuccess = function(message) {
        this.log(terminal.green, arguments);
    },
    this.clearScreen = function() {
        terminal.eraseDisplay();
    },
    this.logQueryToConsole = function(orm_model_name, orm_database_name, source_snippet_location, source_snippet, sql, frame_exception) {
        if (frame_exception) {
            this.logError(`Encountered Exception: ${frame_exception}`)
        } else {
            this.logSuccess('ORM Database Name: ', orm_database_name);
            this.logSuccess('ORM Model Name:    ', orm_model_name);
            this.logSuccess('Snippet Location:  ', source_snippet_location);
            this.logInfo('Snippet:           ', source_snippet);
            this.logInfo('SQL String:        ', sql);
        }
    }
}

function load_config() {
    // load configuration, default if no config file found
    try {
        config = yaml.safeLoad(fs.readFileSync(`${homedir()}/.django-orm-profiler`, 'utf8'));
    } catch (e) {
        // defaults connection details
        config = {
            telemetry_host: '127.0.0.1',
            telemetry_port: 7734
        }
    }

    return config;
}

module.exports = {
    config: load_config(),
    ProfilerScreen: ProfilerScreen,
    ConsoleLogger: ConsoleLogger,
    QueryStore: QueryStore
};
