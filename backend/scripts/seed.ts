import { getSql, db } from '../src/db';
import { admin, candidates, voting } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import process from 'node:process';
import { hashPassword } from '../src/services/admin.service';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Initialize Voting Status (if not exists)
    const existingVoting = await db.select().from(voting);
    if (existingVoting.length === 0) {
      await db.insert(voting).values({
        id: 1,
        voting_title: 'TEC Presidential Election 2026',
        vot_start_date: new Date(),
        vot_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        last_reset: new Date(),
        is_live_score_enabled: false
      });
      console.log('✅ Voting configuration initialized.');
    }

    // 2. Initialize Default Admin
    const existingAdmins = await db.select().from(admin);
    if (existingAdmins.length === 0) {
      const hashedPassword = await hashPassword('admin123');
      await db.insert(admin).values({
        name: 'TEC Super Admin',
        email: 'admin@tec.com',
        password: hashedPassword,
        role: 'owner'
      });
      console.log('✅ Default Admin created: admin@tec.com / admin123');
    }

    // 3. Initialize Mock Candidates
    const existingCandidates = await db.select().from(candidates);
    if (existingCandidates.length === 0) {
      await db.insert(candidates).values([
        {
          name: 'Alice Johnson',
          nim: '202200001',
          major: 'Computer Science',
          batch: 2022,
          votes: 0
        },
        {
          name: 'Bob Smith',
          nim: '202200002',
          major: 'Information Systems',
          batch: 2022,
          votes: 0
        },
        {
          name: 'Charlie Davis',
          nim: '202200003',
          major: 'Visual Communication Design',
          batch: 2022,
          votes: 0
        }
      ]);
      console.log('✅ 3 Mock candidates inserted.');
    } else {
      console.log('⚠️ Candidates already exist, skipping...');
    }

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seed();
