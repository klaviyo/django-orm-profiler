#!/usr/bin/env node

// local modules
const receiver = require('./profiler_client/common/receiver');

// community modules
const argparse = require('commander');

argparse.arguments('')
    .option(
        '-m, --mode [type]',
        'Mode to run the profiler in, `console` for a stream of events to STDOUT or `gui` for the debugger UI.',
        'gui'
    ).parse(process.argv);

receiver.server.start(argparse.mode);
