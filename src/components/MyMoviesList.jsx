import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWatched, getFavorites } from '../utils/api';

function MyMoviesList() {
  const { signed, currentUser } = useAuth();
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [activeTab, setActiveTab] = useState('watched');
  const API_KEY = 'c59086531f209ac2717b0e50f8c6ef59'; 

  useEffect(() => {
    const fetchWatchedMovies = async () => {
      try {
        if (signed && currentUser) {
          const movieIds = await getWatched(currentUser.username);

          if (movieIds.length === 0) {
            setWatchedMovies([]);
          } else {
            const limitedMovieIds = movieIds.slice(0, 5);

            const moviePromises = limitedMovieIds.map(async (id) => {
              try {
                const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=pt-BR`);
                if (!response.ok) throw new Error('Erro ao buscar detalhes do filme');
                const movieData = await response.json();
                return movieData;
              } catch (movieError) {
                console.error(`Erro ao buscar detalhes do filme ID ${id}:`, movieError);
                return null;
              }
            });

            const movies = await Promise.all(moviePromises);
            const validMovies = movies.filter(movie => movie !== null);
            setWatchedMovies(validMovies);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar filmes assistidos:', error);
      }
    };

    if (activeTab === 'watched') {
      fetchWatchedMovies();
    }
  }, [signed, currentUser, API_KEY, activeTab]);

  useEffect(() => {
    const fetchFavoriteMovies = async () => {
      try {
        if (signed && currentUser) {
          const movieIds = await getFavorites(currentUser.username);

          if (movieIds.length === 0) {
            setFavoriteMovies([]);
          } else {
            const moviePromises = movieIds.map(async (id) => {
              try {
                const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=pt-BR`);
                if (!response.ok) throw new Error('Erro ao buscar detalhes do filme');
                const movieData = await response.json();
                return movieData;
              } catch (movieError) {
                console.error(`Erro ao buscar detalhes do filme ID ${id}:`, movieError);
                return null;
              }
            });

            const movies = await Promise.all(moviePromises);
            const validMovies = movies.filter(movie => movie !== null);
            setFavoriteMovies(validMovies);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar filmes favoritos:', error);
      }
    };

    if (activeTab === 'favorites') {
      fetchFavoriteMovies();
    }
  }, [signed, currentUser, API_KEY, activeTab]);

  if (!signed) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver sua lista.</span>
      </div>
    );
  }

  const renderMovies = (movies) => {
    if (!movies.length) {
      return (
        <div className="flex justify-center items-center h-48">
          <span className="text-gray-500 dark:text-gray-400">
            {activeTab === 'watched' ? 'Nenhum filme marcado como visto.' : 'Nenhum filme nos favoritos.'}
          </span>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {movies.map((movie) => (
          <div key={movie.id} className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
            <Link to={`/movie/${movie.id}`}>
              <img
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-auto rounded hover:scale-105 transform transition-transform duration-300"
                loading="lazy"
              />
              <h3 className="text-lg mt-2 text-center text-white dark:text-gray-800">{movie.title}</h3>
            </Link>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white dark:text-gray-800 mb-8">Minha Lista</h1>
      
      {/* Abas de Navegação */}
      <div className="flex mb-6">
        <button
          className={`mr-4 px-4 py-2 rounded ${activeTab === 'watched' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => setActiveTab('watched')}
        >
          Filmes Assistidos
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'favorites' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => setActiveTab('favorites')}
        >
          Filmes Favoritos
        </button>
      </div>

      {activeTab === 'watched' ? renderMovies(watchedMovies) : renderMovies(favoriteMovies)}
    </div>
  );
}

export default MyMoviesList;
