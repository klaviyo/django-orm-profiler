import inspect

from .config import ConfigLoader
from .emitter import Emitter
from .exceptions import NoCaptureFrameFoundException

#
# CONSTANTS
# ------------------------------------------------------------------------------

FRAME_OBJECT_INDEX = 0
FRAME_PATH_INDEX = 1
FRAME_LINE_NUMBER_INDEX = 2
FRAME_METHOD_NAME_INDEX = 3
FRAME_SNIPPET_INDEX = 4
DEFAULT_EMITTER_PORT = 7734
DEFAULT_EMITTER_HOST = '127.0.0.1'

#
# HELPER CLASSES (initialized on import)
# ------------------------------------------------------------------------------

PROFILER_CONFIG = ConfigLoader()
PROFILER_EMITTER = Emitter(
    PROFILER_CONFIG.get('telemetry_host', DEFAULT_EMITTER_PORT),
    PROFILER_CONFIG.get('telemetry_port', DEFAULT_EMITTER_HOST)
)

#
# STACK CAPTURE HOOK
# ------------------------------------------------------------------------------

""" Entry point monkey patched into the Django SQLCompiler class. Responsible for
    evaluating the call stack for execution specific code references and then
    emitting the entire payload for any listening clients to aggregate and display.

Args:
    orm_database_name: the Django connection name for the database this query ran against
    model: the Django model class that defines the table being queried
    sql: the raw SQL Django has compiled and will run
Returns:
    None
Raises:
    Nothing, all exceptions are swallowed up (and emitted) to keep this utility
    transparent to the host application.

"""
def sql_logger(orm_database_name, model, sql):
    stack = inspect.stack()
    stack_information = {}

    try:
        capture_frame = None

        # walk all of our available frames, searching for our `capture_frame`
        for index, frame in enumerate(stack):
            # ignore the frame for this method
            if 'sql_logger' in frame[FRAME_METHOD_NAME_INDEX]:
                continue

            # if our config specifies frames we should ignore, skip them here
            if any([prefix in frame[FRAME_PATH_INDEX] for prefix in PROFILER_CONFIG.get('ignore_prefixes', [])]):
                continue

            # if this frame matches our `catch_frame` then set it for reference later
            # and iterate over the next 5 frames for more context to display
            if PROFILER_CONFIG.get('catch_frame', 'NOT_IMPLEMENTED') in frame[FRAME_PATH_INDEX]:
                capture_frame = frame
                context = []
                for future_frame in stack[index + 1:index + 5]:
                    context.append(
                        '{}:{}'.format(future_frame[FRAME_PATH_INDEX], future_frame[FRAME_LINE_NUMBER_INDEX])
                    )
                break

        if capture_frame:
            snippet_location = '{}:{}'.format(capture_frame[FRAME_PATH_INDEX], capture_frame[FRAME_LINE_NUMBER_INDEX])
            stack_information.update({
                'orm_model_name' : model.__name__,
                'orm_database_name' : orm_database_name,
                'source_snippet' : capture_frame[FRAME_SNIPPET_INDEX][0].strip(),
                'source_snippet_location' : snippet_location,
                'source_snippet_context' : context,
                'sql' : sql,
            })

            PROFILER_EMITTER.emit(stack_information)

        else:
            raise NoCaptureFrameFoundException('model: {} sql: {}'.format(
                model.__name__,
                sql,
            ))

    except NoCaptureFrameFoundException as exception:
        PROFILER_EMITTER.emit({
            'frame_exception' : 'no capture frame caught with "{}" - {}'.format(
                PROFILER_CONFIG.get('catch_frame', 'NO FRAME DEFINED'),
                str(exception),
            ),
        })

    except Exception as error:
        PROFILER_EMITTER.emit({
            'frame_exception' : str(error),
        })
