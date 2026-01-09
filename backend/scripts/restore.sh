#!/bin/bash

# ============================================
# CASESTACK DATABASE RESTORE SCRIPT
# Restore PostgreSQL database from backup
# ============================================

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CASESTACK DATABASE RESTORE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
    exit 1
fi

# List available backups
echo "Available backups:"
echo ""
ls -lh "$BACKUP_DIR"/casestack_backup_*.sql.gz 2>/dev/null | awk '{print NR". "$9" ("$5")"}'

if [ $? -ne 0 ]; then
    echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

echo ""
read -p "Enter backup number to restore (or 'q' to quit): " BACKUP_NUM

if [ "$BACKUP_NUM" = "q" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Get selected backup file
BACKUP_FILE=$(ls "$BACKUP_DIR"/casestack_backup_*.sql.gz 2>/dev/null | sed -n "${BACKUP_NUM}p")

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}Invalid backup number${NC}"
    exit 1
fi

echo ""
echo "Selected backup: $BACKUP_FILE"
echo ""
echo -e "${RED}WARNING: This will OVERWRITE the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Extract database connection details
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Decompress backup
echo -e "${YELLOW}Decompressing backup...${NC}"
TEMP_FILE="/tmp/casestack_restore_$(date +%s).sql"
gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Decompression failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backup decompressed${NC}"

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"

export PGPASSWORD="$DB_PASS"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    
    # Clean up temp file
    rm "$TEMP_FILE"
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}RESTORE COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # Log restore
    echo "$(date +"%Y-%m-%d %H:%M:%S") - Database restored from: $BACKUP_FILE" >> "$BACKUP_DIR/restore.log"
    
    exit 0
else
    echo -e "${RED}✗ Restore failed${NC}"
    rm "$TEMP_FILE"
    exit 1
fi
