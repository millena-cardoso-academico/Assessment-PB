import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaTelegramPlane, FaInstagram, FaCamera } from 'react-icons/fa';
import {
  getUser,
  getUserPlan,
  getLimitUsage,
  getWatched,
  getPurchasedMovies,
  setProfileImage,
} from '../utils/api';

function Profile() {
  const { signed, currentUser } = useAuth();
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [purchasedMovies, setPurchasedMovies] = useState([]);
  const [username, setUsername] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planEndDate, setPlanEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_KEY = 'c59086531f209ac2717b0e50f8c6ef59'; 

  const [limitUsage, setLimitUsage] = useState({
    movie_limit: 0,
    purchased: 0,
    remaining: 0
  });

  const [profileImage, setProfileImageState] = useState(null); 
  const [profileImageURL, setProfileImageURL] = useState(null);
  const [uploading, setUploading] = useState(false);

  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) {
      console.error('parseDateTime: dateTimeStr is undefined or null');
      return null;
    }

    let parsedDate = null;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/.test(dateTimeStr)) {
      parsedDate = new Date(dateTimeStr);
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(dateTimeStr)) {
      const isoString = dateTimeStr.replace(' ', 'T') + 'Z';
      parsedDate = new Date(isoString);
    } else if (/^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}(:\d{2})?)?$/.test(dateTimeStr)) {
      const [date, time] = dateTimeStr.split(' ');
      const [day, month, year] = date.split('/');
      if (time) {
        const [hours, minutes, seconds] = time.split(':');
        parsedDate = new Date(year, month - 1, day, hours, minutes, seconds || 0);
      } else {
        parsedDate = new Date(year, month - 1, day);
      }
    } else {
      console.error(`parseDateTime: Unknown dateTimeStr format - ${dateTimeStr}`);
      return null;
    }

    if (isNaN(parsedDate)) {
      console.error(`parseDateTime: Invalid date - ${dateTimeStr}`);
      return null;
    }

    return parsedDate;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (signed && currentUser) {
          const user = await getUser(currentUser.username);
          setUsername(user.username);
          setProfileImageState(user.profileImage); 

          const plan = await getUserPlan(currentUser.username);
          setCurrentPlan(plan);
          setPlanEndDate(plan ? plan.end_date : null);

          const usage = await getLimitUsage(currentUser.username);
          setLimitUsage(usage);

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

          const purchasedData = await getPurchasedMovies(currentUser.username);
          setPurchasedMovies(purchasedData);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do usuário ou filmes assistidos:', err);
        setError('Falha ao carregar os dados do perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [signed, currentUser, API_KEY]);

  useEffect(() => {
    if (profileImage) {
      const url = URL.createObjectURL(profileImage);
      setProfileImageURL(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setProfileImageURL(null);
    }
  }, [profileImage]);

  const hasSessionPassed = (sessionDateTime) => {
    const now = new Date();
    const session = new Date(sessionDateTime);
    return session < now;
  };

  const copyToClipboard = async (url) => {
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copiado para a área de transferência!');
      } catch (err) {
        console.error('Falha ao copiar o link: ', err);
        alert('Falha ao copiar o link.');
      }
      document.body.removeChild(textArea);
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Falha ao copiar o link: ', err);
      alert('Falha ao copiar o link.');
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPEG, JPG, GIF).');
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('A imagem selecionada é muito grande. Por favor, selecione uma imagem com no máximo 2MB.');
        return;
      }

      try {
        setUploading(true);
        await setProfileImage(currentUser.username, file);
        setProfileImageState(file);
        alert('Imagem de perfil atualizada com sucesso.');
      } catch (error) {
        console.error('Erro ao fazer upload da imagem de perfil:', error);
        alert('Falha ao carregar a imagem de perfil.');
      } finally {
        setUploading(false);
      }
    }
  };

  if (!signed) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver seu perfil.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando perfil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-red-500 dark:text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Informações do Usuário */}
      <div className="mb-8 flex items-center">
        <div className="relative">
          {profileImageURL ? (
            <img
              src={profileImageURL}
              alt="Foto de Perfil"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-500 flex items-center justify-center text-white">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors duration-300">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
            {/* Ícone de upload (usando FaCamera) */}
            <FaCamera className="h-6 w-6 text-white" />
          </label>
        </div>
        <div className="ml-4">
          <h1 className="text-3xl font-bold text-white dark:text-gray-800">Perfil</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            Bem-vindo, <span className="font-semibold">{username}</span>!
          </p>
          {uploading && <p className="text-sm text-blue-500">Carregando imagem...</p>}
        </div>
      </div>

      {/* Informações do Plano */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">Seu Plano</h2>
        {currentPlan ? (
          <div className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
            <p className="text-lg text-white dark:text-gray-800">Plano: {currentPlan.name}</p>
            <p className="text-lg text-white dark:text-gray-800">
              Ingressos Permitidos por Mês: {limitUsage.movie_limit}
            </p>
            {planEndDate && (
              <p className="text-lg text-white dark:text-gray-800">
                Encerramento do Plano: {parseDateTime(currentPlan.end_date).toLocaleDateString('pt-BR')}
              </p>
            )}
            {/* Exibir Uso do Plano */}
            <div className="mt-4">
              <p className="text-lg text-white dark:text-gray-800">
                Ingressos Comprados: {limitUsage.purchased} / {limitUsage.movie_limit}
              </p>
              <div className="w-full bg-gray-300 dark:bg-gray-400 rounded-full h-4 mt-2">
                <div
                  className="bg-blue-500 dark:bg-blue-700 h-4 rounded-full"
                  style={{
                    width: `${(limitUsage.purchased / limitUsage.movie_limit) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-lg text-white dark:text-gray-800 mt-2">
                Ingressos Restantes: {limitUsage.remaining}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
            <p className="text-lg text-white dark:text-gray-800">
              Você não tem nenhum plano ativo.
            </p>
            <Link to="/plans" className="text-blue-500 dark:text-blue-700 hover:underline">
              Assine um plano agora
            </Link>
          </div>
        )}
      </div>

      {/* Lista de Filmes Assistidos Recentemente */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">
          Filmes Assistidos Recentemente
        </h2>
        {watchedMovies.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <span className="text-gray-500 dark:text-gray-400">
              Nenhum filme marcado como visto.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {watchedMovies.map((movie) => (
              <div key={movie.id} className="bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
                {/* Apenas a imagem e o título são clicáveis */}
                <Link to={`/movie/${movie.id}`} className="block">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-auto rounded hover:scale-105 transform transition-transform duration-300"
                    loading="lazy"
                  />
                  <h3 className="text-lg mt-2 text-center text-white dark:text-gray-800">
                    {movie.title}
                  </h3>
                </Link>
              </div>
            ))}
            {/* Botão para Ver Mais Filmes */}
            <div className="flex justify-center items-center bg-gray-700 dark:bg-gray-300 p-4 rounded-lg">
              <Link to="/mylist" className="text-center text-blue-500 dark:text-blue-700 hover:underline">
                Ver Mais
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Ingressos Comprados */}
      <div>
        <h2 className="text-2xl font-semibold text-white dark:text-gray-800 mb-4">Ingressos Comprados</h2>
        {purchasedMovies.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <span className="text-gray-500 dark:text-gray-400">Nenhum ingresso comprado.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {purchasedMovies.map((item) => {
              if (!item || !item.purchase_date) {
                console.error('Item inválido ou sem purchase_date:', item);
                return (
                  <div
                    key={item.id || item.movie_id || Math.random()} 
                    className="p-4 rounded-lg bg-gray-500 dark:bg-gray-400 cursor-not-allowed"
                  >
                    <p className="text-center text-white dark:text-gray-800">Dados de ingresso inválidos.</p>
                  </div>
                );
              }

              const sessionDateTime = parseDateTime(`${item.date} ${item.showtime}`);
              const sessionPassed = hasSessionPassed(sessionDateTime);

              const purchaseDateTime = parseDateTime(item.purchase_date);
              if (!purchaseDateTime) {
                console.error(`Data de compra inválida para o item:`, item);
                return (
                  <div
                    key={item.id || item.movie_id || Math.random()}
                    className="p-4 rounded-lg bg-gray-500 dark:bg-gray-400 cursor-not-allowed"
                  >
                    <p className="text-center text-white dark:text-gray-800">Data de compra inválida.</p>
                  </div>
                );
              }

              const formattedPurchaseDate = purchaseDateTime.toLocaleDateString('pt-BR');
              const formattedPurchaseTime = purchaseDateTime.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const movieLink = `${window.location.origin}/movie/${item.movie_id}`;

              return (
                <div
                  key={item.movie_id}
                  className={`p-4 rounded-lg ${
                    sessionPassed
                      ? 'bg-gray-500 dark:bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 dark:bg-gray-300 hover:bg-gray-600 dark:hover:bg-gray-200 cursor-pointer'
                  }`}
                >
                  {/* Apenas a imagem e o título são clicáveis */}
                  <Link to={`/movie/${item.movie_id}`} className={`block ${sessionPassed ? 'cursor-default' : ''}`}>
                    <h3 className="text-lg mt-2 text-center text-white dark:text-gray-800">
                      {item.title}
                    </h3>
                    <p className="text-sm text-center text-gray-400 dark:text-gray-600">
                      Sessão: {sessionDateTime.toLocaleDateString('pt-BR')} às{' '}
                      {sessionDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-center text-gray-400 dark:text-gray-600">
                      Compra: {formattedPurchaseDate} às {formattedPurchaseTime}
                    </p>
                  </Link>
                  
                  {/* Botões de Compartilhamento */}
                  <div className="mt-4 flex justify-center space-x-4">
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=Confira este filme: ${encodeURIComponent(movieLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-700"
                      title="Compartilhar no WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaWhatsapp size={24} />
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(movieLink)}&text=Confira este filme!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                      title="Compartilhar no Telegram"
                      onClick={(e) => e.stopPropagation()} 
                    >
                      <FaTelegramPlane size={24} />
                    </a>

                    {/* Instagram (Copiar Link) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(movieLink);
                      }}
                      className="text-pink-500 hover:text-pink-700"
                      title="Copiar Link para Compartilhar no Instagram"
                    >
                      <FaInstagram size={24} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;