import db from '../db';
import { parseISO } from 'date-fns';

/* ================================================
   1. FAVORITOS
   ================================================ */

export async function addFavorite(username, movie_id) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const existing = await db.favorite_movies.where({ user_id: user.id, movie_id }).first();
  if (existing) throw new Error('Filme já está nos favoritos');

  await db.favorite_movies.add({ user_id: user.id, movie_id });
  return 'Filme adicionado aos favoritos com sucesso.';
}

export async function removeFavorite(username, movie_id) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const deleted = await db.favorite_movies.where({ user_id: user.id, movie_id }).delete();
  if (deleted === 0) throw new Error('Filme não encontrado nos favoritos.');

  return 'Filme removido dos favoritos com sucesso.';
}

export async function getFavorites(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const favorites = await db.favorite_movies.where('user_id').equals(user.id).toArray();
  return favorites.map(fav => fav.movie_id);
}

/* ================================================
   2. FILMES ASSISTIDOS
   ================================================ */

export async function addWatched(username, movie_id) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const existing = await db.watched_movies.where({ user_id: user.id, movie_id }).first();
  if (existing) throw new Error('Filme já marcado como visto');

  await db.watched_movies.add({ user_id: user.id, movie_id });
  return 'Filme marcado como visto.';
}

export async function getWatched(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const watched = await db.watched_movies.where('user_id').equals(user.id).toArray();
  return watched.map(w => w.movie_id);
}

/* ================================================
   3. RATINGS
   ================================================ */

export async function addOrUpdateRating(username, movie_id, rating) {
  if (rating < 1 || rating > 5) throw new Error('A avaliação deve ser um número entre 1 e 5');

  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const existing = await db.ratings.where({ user_id: user.id, movie_id }).first();
  if (existing) {
    await db.ratings.update(existing.id, { rating });
    return 'Avaliação atualizada com sucesso';
  } else {
    await db.ratings.add({ user_id: user.id, movie_id, rating });
    return 'Avaliação registrada com sucesso';
  }
}

export async function getRating(username, movie_id) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const rating = await db.ratings.where({ user_id: user.id, movie_id }).first();
  return rating ? rating.rating : null;
}

/* ================================================
   4. PLANOS
   ================================================ */

export async function getPlans() {
  const plans = await db.plans.toArray();
  return plans;
}

export async function subscribePlan(username, plan_id) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const plan = await db.plans.where('id').equals(plan_id).first();
  if (!plan) throw new Error('Plano não encontrado');

  const currentDate = new Date();
  const oneMonthLater = new Date(currentDate);
  oneMonthLater.setMonth(currentDate.getMonth() + 1);

  await db.user_plans.add({
    user_id: user.id,
    plan_id: plan_id,
    start_date: currentDate.toISOString(),
    end_date: oneMonthLater.toISOString(),
  });

  return `Plano "${plan.name}" assinado com sucesso.`;
}

export async function getUserPlan(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const currentDate = new Date().toISOString();

  const userPlan = await db.user_plans
    .where('user_id')
    .equals(user.id)
    .filter(plan =>
      new Date(plan.start_date) <= new Date(currentDate) &&
      new Date(plan.end_date) >= new Date(currentDate)
    )
    .reverse()
    .first();

  if (!userPlan) return null;

  const plan = await db.plans.where('id').equals(userPlan.plan_id).first();

  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    movie_limit: plan.movie_limit,
    start_date: userPlan.start_date,
    end_date: userPlan.end_date,
  };
}

/* ================================================
   5. CARRINHO
   ================================================ */

export async function addToCart(username, movie_id, title, showtime, date) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  await db.cart_items.add({
    user_id: user.id,
    movie_id,
    title,
    showtime,
    date,
  });

  return 'Ingresso adicionado ao carrinho com sucesso!';
}

export async function getCart(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const cart = await db.cart_items.where('user_id').equals(user.id).toArray();
  return cart;
}

export async function removeFromCart(id) {
  const deleted = await db.cart_items.where('id').equals(id).delete();
  if (deleted === 0) throw new Error('Ingresso não encontrado no carrinho');
  return 'Ingresso removido do carrinho com sucesso!';
}

/* ================================================
   6. COMPRAS
   ================================================ */

export async function purchase(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const userPlan = await getUserPlan(username);

  const purchasedCount = await db.purchased_movies
    .where('user_id')
    .equals(user.id)
    .and(pm => new Date(pm.purchase_date) >= new Date(userPlan.start_date) &&
               new Date(pm.purchase_date) <= new Date(userPlan.end_date))
    .count();

  const cartCount = await db.cart_items.where('user_id').equals(user.id).count();

  if ((purchasedCount + cartCount) > userPlan.movie_limit) {
    throw new Error('Compra excede o limite do seu plano.');
  }

  const cartItems = await db.cart_items.where('user_id').equals(user.id).toArray();
  if (cartItems.length === 0) throw new Error('Carrinho está vazio.');

  return await db.transaction('rw', db.purchased_movies, db.cart_items, async () => {
    await db.purchased_movies.bulkAdd(
      cartItems.map(item => ({
        user_id: item.user_id,
        movie_id: item.movie_id,
        title: item.title,
        showtime: item.showtime,
        date: item.date,
        purchase_date: new Date().toISOString(),
      }))
    );

    // Limpar o carrinho
    await db.cart_items.where('user_id').equals(user.id).delete();

    return 'Compra realizada com sucesso.';
  });
}

export async function getPurchasedMovies(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  const purchased = await db.purchased_movies.where('user_id').equals(user.id).toArray();
  console.log(purchased);
  return purchased;
}

/* ================================================
   7. USUÁRIO
   ================================================ */

export async function getUser(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');
  return user;
}

export async function setProfileImage(username, imageBlob) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  await db.users.update(user.id, { profileImage: imageBlob });
  return 'Imagem de perfil atualizada com sucesso.';
}

export async function getProfileImage(username) {
  const user = await db.users.where('username').equals(username).first();
  if (!user) throw new Error('Usuário não encontrado');

  return user.profileImage;
}


/* ================================================
   8. LIMIT USAGE
   ================================================ */

export async function getLimitUsage(username) {
  try {
    const user = await db.users.where('username').equals(username).first();
    if (!user) throw new Error('Usuário não encontrado');

    const userPlan = await getUserPlan(username);

    console.log('Plano do Usuário:', userPlan);

    if (!userPlan.start_date || !userPlan.end_date) {
      throw new Error('start_date ou end_date do plano estão indefinidos');
    }

    const planStartDate = parseISO(userPlan.start_date);
    const planEndDate = parseISO(userPlan.end_date);

    if (isNaN(planStartDate) || isNaN(planEndDate)) {
      throw new Error('Datas do plano inválidas');
    }

    const purchased = await db.purchased_movies
      .where('user_id')
      .equals(user.id)
      .and(pm => {
        if (!pm.purchase_date) {
          return false;
        }
        const purchaseDate = typeof pm.purchase_date === 'string' ? parseISO(pm.purchase_date) : pm.purchase_date;
        if (isNaN(purchaseDate)) {
          return false;
        }
        const isWithinPlan =
          purchaseDate >= planStartDate && purchaseDate <= planEndDate;
        if (!isWithinPlan) {
          console.log(`Compra fora do plano: ${pm.purchase_date}`);
        }
        return isWithinPlan;
      })
      .count();

    const remaining = userPlan.movie_limit - purchased;

    console.log('Ingressos Restantes:', remaining);

    return {
      movie_limit: userPlan.movie_limit,
      purchased,
      remaining,
    };
  } catch (error) {
    console.error('Erro em getLimitUsage:', error);
    throw error;
  }
}

/* ================================================
   9. DETALHES DO FILME
   ================================================ */

export async function getMovieDetails(movie_id) {
  const API_KEY = 'c59086531f209ac2717b0e50f8c6ef59';
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos`);
    if (!response.ok) throw new Error('Erro ao buscar detalhes do filme');
    const movieData = await response.json();
    return movieData;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do filme ID ${movie_id}:`, error);
    return null;
  }
}
