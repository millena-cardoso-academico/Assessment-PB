import React, { useEffect, useState } from 'react';
import Carousel from './Carousel';
import { useAuth } from '../contexts/AuthContext';
import {
  getWatched,
  getMovieDetails
} from '../utils/api';

function MovieCarousel() {
  const API_KEY = 'c59086531f209ac2717b0e50f8c6ef59';
  const { signed, currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchWatchedMovies = async () => {
      try {
        if (signed && currentUser) {
          const movieIds = await getWatched(currentUser.username);
          setWatchedMovies(movieIds);
        }
      } catch (error) {
        console.error('Erro ao buscar filmes assistidos:', error);
      }
    };

    fetchWatchedMovies();
  }, [signed, currentUser]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const genresResponse = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=pt-BR`
        );
        if (!genresResponse.ok) throw new Error('Erro ao buscar gêneros');
        const genresData = await genresResponse.json();
        const genres = genresData.genres;

        const categoryPromises = genres.map(async (genre) => {
          const moviesResponse = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&with_genres=${genre.id}`
          );
          if (!moviesResponse.ok) throw new Error(`Erro ao buscar filmes para o gênero ${genre.name}`);
          const moviesData = await moviesResponse.json();
          const movies = await Promise.all(
            moviesData.results.map(async (movie) => {
              const movieDetails = await getMovieDetails(movie.id);
              return {
                id: movie.id,
                title: movie.title,
                image: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=Sem+Imagem',
                isWatched: watchedMovies.includes(movie.id),
              };
            })
          );
          return {
            name: genre.name,
            movies,
          };
        });

        const categoriesData = await Promise.all(categoryPromises);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
      }
    };

    fetchCategories();
  }, [API_KEY, watchedMovies]);

  return (
    <div>
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar filmes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-gray-800"
        />
      </div>

      {categories.map((category, index) => {
        const filteredMovies = category.movies.filter((movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredMovies.length === 0) return null;

        return (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 dark:text-gray-800">{category.name}</h2>
            <Carousel slides={filteredMovies} />
          </div>
        );
      })}
    </div>
  );
}

export default MovieCarousel;
