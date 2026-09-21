from .base import BaseJobConnector
from .remoteok_connector import RemoteOKConnector
from .jobicy_connector import JobicyConnector
from .arbeitnow_connector import ArbeitnowConnector
from .adzuna_connector import AdzunaConnector
from .jooble_connector import JoobleConnector

ALL_CONNECTORS = [
    RemoteOKConnector(),
    JobicyConnector(),
    ArbeitnowConnector(),
    AdzunaConnector(),
    JoobleConnector()
]
