import sqlite3

def fix_fk_violations():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    print("Checking for FK violations...")
    cursor.execute('PRAGMA foreign_key_check')
    violations = cursor.fetchall()
    
    if not violations:
        print("No FK violations found.")
    else:
        print(f"Found {len(violations)} FK violations.")
        for table, rowid, parent, fkid in violations:
            print(f"Violation in table {table}, rowid {rowid}. Deleting...")
            # We use rowid to delete specifically the offending row
            cursor.execute(f"DELETE FROM {table} WHERE rowid = ?", (rowid,))
        
        conn.commit()
        print("Violations fixed.")
    
    conn.close()

if __name__ == "__main__":
    fix_fk_violations()
