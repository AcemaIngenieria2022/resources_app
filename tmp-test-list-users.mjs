import { listUsers } from './src/services/users/user.service.js';

(async () => {
  try {
    const res = await listUsers({ limit: 10 });
    console.log('LIST_USERS_OK', res.users?.length);
    console.log(res.users?.slice(0,3));
  } catch (err) {
    console.error('LIST_USERS_ERROR', err.message);
    process.exit(1);
  }
})();
