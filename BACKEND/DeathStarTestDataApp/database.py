from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

SQLALCHEMY_DATABASE_URL = 'sqlite:///./deathstartestdata.db'

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})


@event.listens_for(engine, 'connect')
def _enable_wal_mode(dbapi_connection, connection_record):
    # WAL mode lets readers proceed while a write is in progress, instead of
    # SQLite's default of locking the whole file for the duration of a write.
    # synchronous=NORMAL is the pairing SQLite's own docs recommend with WAL.
    cursor = dbapi_connection.cursor()
    cursor.execute('PRAGMA journal_mode=WAL')
    cursor.execute('PRAGMA synchronous=NORMAL')
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
