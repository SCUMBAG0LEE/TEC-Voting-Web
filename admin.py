#!/usr/bin/env python3
"""
Admin Credential Generator for TEC Voting System
Generates admin email and hashed password for MariaDB

Usage: python generate_admin_credentials.py [options]

Options:
  -e, --email EMAIL       Admin email address
  -p, --password PASSWORD Admin password (will prompt if not provided)
  -n, --name NAME         Admin name (optional)
  --no-hash               Output plain password (not recommended for production)
"""

import bcrypt
import secrets
import string
import sys
import getpass
import argparse
from datetime import datetime


def generate_random_password(length: int = 16) -> str:
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def hash_password(password: str, salt_rounds: int = 10) -> str:
    """Hash a password using bcrypt (matching backend implementation)"""
    salt = bcrypt.gensalt(rounds=salt_rounds)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def validate_email(email: str) -> bool:
    """Basic email validation"""
    return '@' in email and '.' in email.split('@')[1]


def main():
    parser = argparse.ArgumentParser(
        description='Generate admin credentials for TEC Voting System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python generate_admin_credentials.py --email admin@example.com --password mypassword
  python generate_admin_credentials.py --email admin@example.com
  python generate_admin_credentials.py --email admin@example.com --name "Admin User"
        '''
    )

    parser.add_argument('-e', '--email', help='Admin email address')
    parser.add_argument('-p', '--password', help='Admin password (will prompt if not provided)')
    parser.add_argument('-n', '--name', default='Administrator', help='Admin name (default: Administrator)')
    parser.add_argument('--no-hash', action='store_true', help='Output plain password (NOT recommended for production)')

    args = parser.parse_args()

    # Get email
    email = args.email
    if not email:
        print("=== TEC Voting System - Admin Credential Generator ===\n")
        email = input("Enter admin email address: ").strip()

    if not email or not validate_email(email):
        print("❌ Invalid email address")
        sys.exit(1)

    # Get password
    password = args.password
    if not password:
        password = getpass.getpass("Enter admin password (or press Enter to generate random): ").strip()
        if not password:
            password = generate_random_password()
            print(f"Generated random password: {password}")

    if len(password) < 1:
        print("❌ Password cannot be empty")
        sys.exit(1)

    # Get admin name
    name = args.name

    # Hash password
    if args.no_hash:
        hashed_password = password
        warning = "⚠️  WARNING: Plain text password is NOT recommended for production!"
    else:
        hashed_password = hash_password(password)
        warning = None

    # Output results
    print("\n" + "="*60)
    print("ADMIN CREDENTIALS GENERATED")
    print("="*60)
    print(f"\nName:     {name}")
    print(f"Email:    {email}")
    print(f"Password: {password}")
    print(f"\nHashed Password (for database):")
    print(f"{hashed_password}")

    if warning:
        print(f"\n{warning}")

    print("\n" + "="*60)
    print("SQL INSERT STATEMENT")
    print("="*60)
    sql = f"INSERT INTO admin (name, email, password, created_at) VALUES ('{name}', '{email}', '{hashed_password}', NOW());"
    print(f"\n{sql}\n")

    print("="*60)
    print("INSTRUCTIONS FOR MARIADB")
    print("="*60)
    print("""
1. Connect to MariaDB:
   mysql -h localhost -u root -p

2. Use your voting database:
   USE voting;

3. Run the SQL insert statement above

4. Verify the insert:
   SELECT * FROM admin;

5. Login with these credentials in the admin panel
""")

    print("\n✅ Admin credentials generated successfully!")


if __name__ == '__main__':
    main()
