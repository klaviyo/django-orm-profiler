import socket

from django.core.serializers.json import DjangoJSONEncoder


class Emitter(object):

    def __init__(self, host, port):
        self.emit_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.connection_params = (
            host,
            port
        )

    """ Public method used to make a UDP request to the instances configured host
        and port value. Serializes to JSON.

    Args:
        payload: dictionary containing query details
    Returns:
        Nothing
    Raises:
        Nothing

    """
    def emit(self, payload):
        self.emit_socket.sendto(
            DjangoJSONEncoder().encode(payload).encode(),
            self.connection_params
        )
