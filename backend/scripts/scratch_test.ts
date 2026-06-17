import { db } from '../src/db/index';
import { voters } from '../src/db/schema';

async function test() {
  try {
    await db.insert(voters).values({ nim: '535220092' });
    console.log('Inserted');
  } catch (error: any) {
    console.log('Error caught:', error);
    console.log('Error code:', error.code);
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
  }
}

test();
