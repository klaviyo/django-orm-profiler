from os import path

import yaml

class ConfigLoader(object):
    CONFIG_FILE_NAME = '.django-orm-profiler'

    def __init__(self):
        self.config = self._load_config()

    """ Public accessor used to retrieve configuration values.

    Args:
        key: the key that the config value is stored behind
        default: the value to return in a case where the config value is not found
    Returns:
        configuration value, passed in default value, or None.
    Raises:
        Nothing

    """
    def get(self, key, default=None):
        return self.config.get(key, default)

    """ Private method to attempt to load a config file from the current home
        directory. Exceptions are swallowed up to maintain transparency to the
        host application.

    Args:
        None
    Returns:
        dictionary loaded from YAML file or defaulted to and empty dictionary.
    Raises:
        Nothing

    """
    def _load_config(self):
        config_file_path = path.join(path.expanduser("~"), self.CONFIG_FILE_NAME)

        try:
            with open(config_file_path) as config_file:
                config = yaml.load(config_file)
        except:
            config = {}

        return config
