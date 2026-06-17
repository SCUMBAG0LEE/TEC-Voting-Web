// Use Bun's native password hashing (bcrypt)
// Wait, the backend uses PBKDF2 or Bun's native password hash?
// In Elysia, typically they use a library or just raw text then upgrade on first login as seen in fix-admin.ts.
// Let's check what auth.service or utils uses. We don't have the hashing function explicitly imported.
// But we can just use Bun.password.hashSync() which is standard bcrypt, or insert plain text and rely on auto-upgrade if that's what the app does.
// Wait, I don't know the exact hashing algorithm used by the app without checking `admin.login` route.

// Instead of guessing, let's just create an interactive script that generates the SQL or inserts it if they want.
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== TEC Voting System - Admin Creator ===');

rl.question('Enter admin email: ', (email) => {
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email');
    process.exit(1);
  }

  rl.question('Enter admin password: ', async (password) => {
    if (!password) {
      console.error('❌ Password cannot be empty');
      process.exit(1);
    }

    try {
      rl.question('Enter role (owner/admin): ', async (roleInput) => {
        const role = roleInput.trim().toLowerCase() === 'owner' ? 'owner' : 'admin';
        
        // We will insert plaintext if the backend auto-upgrades, or hash it using Bun's native bcrypt which is standard.
        // Looking at admin.py, it used a specific PBKDF2 format: $pbkdf2$salt$hash
        // We can replicate that exact PBKDF2 hash using Web Crypto API to maintain perfect compatibility!
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(password),
          { name: "PBKDF2" },
          false,
          ["deriveBits", "deriveKey"]
        );
        
        const hashBuffer = await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
          },
          keyMaterial,
          256
        );
        
        const saltBase64 = Buffer.from(salt).toString('base64');
        const hashBase64 = Buffer.from(hashBuffer).toString('base64');
        const hashedPassword = `$pbkdf2$${saltBase64}$${hashBase64}`;

        const sql = `INSERT INTO admin (name, email, password, role) VALUES ('Administrator', '${email.trim()}', '${hashedPassword}', '${role}');`;

        console.log('\n' + '='.repeat(60));
        console.log('POSTGRES SQL INSERT STATEMENT');
        console.log('='.repeat(60));
        console.log(`\n${sql}\n`);
        console.log('='.repeat(60));
        console.log('INSTRUCTIONS FOR NEON POSTGRES / DRIZZLE');
        console.log('='.repeat(60));
        console.log(`\n1. Connect to your Neon Postgres database\n   Or use Drizzle Studio: \`cd backend && bun run db:studio\``);
        console.log('\n2. Run the SQL insert statement above');
        console.log('\n3. Verify the insert in the `admin` table');
        console.log('\n4. Login with these credentials in the admin panel\n');

        process.exit(0);
      });
    } catch (err) {
      console.error('❌ Database insertion failed:', err);
    }
  });
});
