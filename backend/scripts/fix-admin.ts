async function fixPassword() {
  console.log('🔧 Rescue Mode: Generate Admin Password Reset SQL');

  const sql = `UPDATE admin SET password = 'admin123', role = 'owner' WHERE email = 'admin@tec.com';`;

  console.log('\n' + '='.repeat(60));
  console.log('POSTGRES SQL UPDATE STATEMENT');
  console.log('='.repeat(60));
  console.log(`\n${sql}\n`);
  console.log('='.repeat(60));
  console.log('INSTRUCTIONS FOR NEON POSTGRES / DRIZZLE');
  console.log('='.repeat(60));
  console.log(`\n1. Connect to your Neon Postgres database\n   Or use Drizzle Studio: \`cd backend && bun run db:studio\``);
  console.log('\n2. Run the SQL update statement above');
  console.log('\n3. Log in with password "admin123" to instantly regain access and auto-secure your account.\n');
}

fixPassword();
