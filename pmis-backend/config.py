import os

# Absolute path so generate_seed.py, run.py and scripts/ all read the same DB file
_BASE_DIR = os.path.abspath(os.path.dirname(__file__))
_DEFAULT_DB = 'sqlite:///' + os.path.join(_BASE_DIR, 'pmis.db')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key-for-dev')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', _DEFAULT_DB)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
