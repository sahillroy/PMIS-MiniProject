import sqlite3
conn = sqlite3.connect('pmis.db')
cur = conn.cursor()

print('=== TABLES ===')
for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table'"):
    print(row)

print('\n=== CANDIDATES (skills, sector_interests) ===')
try:
    for row in cur.execute("SELECT skills, sector_interests FROM candidate LIMIT 3"):
        print(row)
except Exception as e:
    print("Error:", e)

print('\n=== INTERNSHIPS (required_skills, sector) ===')
try:
    for row in cur.execute("SELECT required_skills, sector FROM internship LIMIT 3"):
        print(row)
except Exception as e:
    print("Error:", e)

conn.close()
