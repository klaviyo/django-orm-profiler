from core import exceptions
from core.logger import sql_logger


""" Decorator used to monkey patch the Django SQLCompiler.

Args:
    Accepts and passes on all arguments, the only one being used is the first
    positional argument which is the `self` class reference, the Django SQLCompiler
Returns:
    decorated Django SQLCompiler class.
Raises:
    Nothing

"""
def profiler_wrapper(func):
    def inner(*args, **kwargs):
        compiler = args[0]

        try:
            sql_string = compiler.as_sql()[0]
        except EmptyResultSet:
            sql_string = 'EmptyResultSet raised from Django'

        sql_logger(
            compiler.using,
            compiler.query.model,
            sql_string
        )

        return func(*args, **kwargs)
    return inner

try:
    from django.db.models.sql.compiler import SQLCompiler, SQLInsertCompiler, SQLUpdateCompiler
    from django.db.models.sql.datastructures import EmptyResultSet

    # decorate any SQL compilers that have an `execute_sql` method
    SQLCompiler.execute_sql = profiler_wrapper(SQLCompiler.execute_sql)
    SQLInsertCompiler.execute_sql = profiler_wrapper(SQLInsertCompiler.execute_sql)
    SQLUpdateCompiler.execute_sql = profiler_wrapper(SQLUpdateCompiler.execute_sql)
except:
    raise exceptions.DjangoImportException('Could not import Django SQLCompiler')
