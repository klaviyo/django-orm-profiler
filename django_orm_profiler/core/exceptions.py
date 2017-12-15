""" Raised when an exception is encountered trying to monkey
    patch the Django SQLCompiler class.
"""
class DjangoImportException(Exception): pass

""" Raised when evaluating the call stack for a query and no
    `capture_frame` could be found (to identify application code)
"""
class NoCaptureFrameFoundException(Exception): pass
