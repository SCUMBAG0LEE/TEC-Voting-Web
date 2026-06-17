#!/usr/bin/env python3
"""
Admin Credential Generator for TEC Voting System
Generates admin email and hashed password using PBKDF2 for Postgres

Requirements: None (uses purely Python standard libraries)

Usage: python admin.py [options]

Options:
  -e, --email EMAIL       Admin email address
  -p, --password PASSWORD Admin password (will prompt if not provided)
  -n, --name NAME         Admin name (optional)
  --no-hash               Output plain password (not recommended for production)
"""

import secrets
import string
import sys
import getpass
import argparse
import os
import hashlib
import base64

def generate_random_password(length: int = 16) -> str:
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2 (matching native Web Crypto in backend)"""
    salt = os.urandom(16)
    hash_bytes = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    
    salt_base64 = base64.b64encode(salt).decode('utf-8')
    hash_base64 = base64.b64encode(hash_bytes).decode('utf-8')
    return f"$pbkdf2${salt_base64}${hash_base64}"


def validate_email(email: str) -> bool:
    """Basic email validation"""
    return '@' in email and '.' in email.split('@')[1]


def main():
    parser = argparse.ArgumentParser(
        description='Generate admin credentials for TEC Voting System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python admin.py --email admin@example.com --password mypassword
  python admin.py --email admin@example.com
  python admin.py --email admin@example.com --name "Admin User"
        '''
    )

    parser.add_argument('-e', '--email', help='Admin email address')
    parser.add_argument('-p', '--password', help='Admin password (will prompt if not provided)')
    parser.add_argument('-n', '--name', default='Administrator', help='Admin name (default: Administrator)')
    parser.add_argument('--no-hash', action='store_true', help='Output plain password (NOT recommended for production)')
    parser.add_argument('-r', '--role', default=None, help='Admin role (owner/admin)')

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

    # Get admin role
    role = args.role
    if not role:
        role_input = input("Enter role (owner/admin) [default: admin]: ").strip().lower()
        role = 'owner' if role_input == 'owner' else 'admin'
    else:
        role = 'owner' if role.strip().lower() == 'owner' else 'admin'

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
    print(f"\nHashed Password (for Postgres via oslo/password):")
    print(f"{hashed_password}")

    if warning:
        print(f"\n{warning}")

    print("\n" + "="*60)
    print("POSTGRES SQL INSERT STATEMENT")
    print("="*60)
    # Note: Our Drizzle Postgres schema is: id (serial), name, email, password, role
    sql = f"INSERT INTO admin (name, email, password, role) VALUES ('{name}', '{email}', '{hashed_password}', '{role}');"
    print(f"\n{sql}\n")

    print("="*60)
    print("INSTRUCTIONS FOR NEON POSTGRES / DRIZZLE")
    print("="*60)
    print("""
1. Connect to your Neon Postgres database
   Or use Drizzle Studio: `cd backend && bun run db:studio`

2. Run the SQL insert statement above

3. Verify the insert in the `admin` table

4. Login with these credentials in the admin panel
""")

    print("\n✅ Admin credentials generated successfully!")


if __name__ == '__main__':
    main()
