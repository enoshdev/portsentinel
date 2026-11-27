from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

# SQLite connection args for multi-threaded FastAPI access
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that provides an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_and_upgrade_schema():
    """Non-destructively checks and adds any missing columns to SQLite tables."""
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    with engine.connect() as conn:
        try:
            # 1. MonitoredIP columns
            res = conn.execute(text("PRAGMA table_info(monitored_ips)")).fetchall()
            cols = [r[1] for r in res]
            if cols:
                if "repeated_attempts_count" not in cols:
                    conn.execute(text("ALTER TABLE monitored_ips ADD COLUMN repeated_attempts_count INTEGER DEFAULT 0"))
                if "unique_ports_count" not in cols:
                    conn.execute(text("ALTER TABLE monitored_ips ADD COLUMN unique_ports_count INTEGER DEFAULT 0"))
                if "event_origin" not in cols:
                    conn.execute(text("ALTER TABLE monitored_ips ADD COLUMN event_origin VARCHAR(30) DEFAULT 'demonstration'"))
            
            # 2. ConnectionEvent columns
            res = conn.execute(text("PRAGMA table_info(connection_events)")).fetchall()
            cols = [r[1] for r in res]
            if cols:
                if "destination_ip" not in cols:
                    conn.execute(text("ALTER TABLE connection_events ADD COLUMN destination_ip VARCHAR(45) DEFAULT '127.0.0.1'"))
                if "tcp_flags" not in cols:
                    conn.execute(text("ALTER TABLE connection_events ADD COLUMN tcp_flags VARCHAR(20) DEFAULT ''"))
                if "event_origin" not in cols:
                    conn.execute(text("ALTER TABLE connection_events ADD COLUMN event_origin VARCHAR(30) DEFAULT 'demonstration'"))

            # 3. FirewallRule columns
            res = conn.execute(text("PRAGMA table_info(firewall_rules)")).fetchall()
            cols = [r[1] for r in res]
            if cols:
                if "rule_name" not in cols:
                    conn.execute(text("ALTER TABLE firewall_rules ADD COLUMN rule_name VARCHAR(100)"))
                if "is_automatic" not in cols:
                    conn.execute(text("ALTER TABLE firewall_rules ADD COLUMN is_automatic BOOLEAN DEFAULT 0"))
                if "verification_status" not in cols:
                    conn.execute(text("ALTER TABLE firewall_rules ADD COLUMN verification_status VARCHAR(30) DEFAULT 'SIMULATED'"))
                if "execution_output" not in cols:
                    conn.execute(text("ALTER TABLE firewall_rules ADD COLUMN execution_output TEXT"))
            conn.commit()
        except Exception as e:
            # Table might not exist yet before create_all
            pass

def init_db():
    """Create all database tables defined in the models and upgrade schema."""
    from backend.app.models import MonitoredIP, ConnectionEvent, RiskHistory, FirewallRule
    Base.metadata.create_all(bind=engine)
    check_and_upgrade_schema()
