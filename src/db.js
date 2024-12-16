import Dexie from 'dexie';

const db = new Dexie('MovieAppDB');

db.version(1).stores({
  users: '++id, username, password, profileImage',
  favorite_movies: '++id, user_id, movie_id',
  watched_movies: '++id, user_id, movie_id',
  ratings: '++id, user_id, movie_id, rating',
  plans: '++id, name, price, movie_limit',
  user_plans: '++id, user_id, plan_id, start_date, end_date',
  cart_items: '++id, user_id, movie_id, title, showtime, date',
  purchased_movies: '++id, user_id, movie_id, purchase_date, title, showtime, date',
});

db.on('populate', async () => {
  await db.plans.bulkAdd([
    { name: 'Standard', price: 9.99, movie_limit: 10 },
    { name: 'Premium', price: 19.99, movie_limit: 20 },
  ]);
});

export default db;
