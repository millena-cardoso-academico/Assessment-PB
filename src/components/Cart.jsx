import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  getCart,
  removeFromCart,
  purchase
} from '../utils/api';

function Cart() {
  const { signed, currentUser } = useAuth(); 
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        if (signed && currentUser) {
          const fetchedCart = await getCart(currentUser.username);
          setCartItems(fetchedCart);
        }
      } catch (err) {
        console.error('Erro ao buscar carrinho:', err);
        setError('Não foi possível carregar o carrinho.');
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [signed, currentUser]);

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Erro ao remover do carrinho:', err);
      alert(err.message || 'Erro ao remover do carrinho.');
    }
  };

  const handlePurchase = async () => {
    const confirmPurchase = window.confirm('Você tem certeza que deseja confirmar a compra?');
    if (!confirmPurchase) return;

    setPurchaseLoading(true);
    try {
      const message = await purchase(currentUser.username);
      alert(message);
      setCartItems([]);
    } catch (err) {
      console.error('Erro ao processar compra:', err);
      alert(err.message || 'Erro ao processar a compra.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (!signed) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Você precisa estar logado para ver o carrinho.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500 dark:text-gray-400">Carregando carrinho...</span>
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
      <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
        &larr; Voltar
      </Link>
      <h1 className="text-3xl font-bold text-white dark:text-gray-800 mt-4">Seu Carrinho</h1>
      {cartItems.length === 0 ? (
        <div className="mt-8 text-gray-500 dark:text-gray-400">Seu carrinho está vazio.</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-gray-700 dark:bg-gray-300 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-white dark:text-gray-800">Ingresso para:</h2>
                <p className="text-gray-300 dark:text-gray-700">{item.title}</p>
                <p className="text-gray-300 dark:text-gray-700">Horário: {item.showtime}</p>
                <p className="text-gray-300 dark:text-gray-700">Data: {new Date(item.date).toLocaleDateString('pt-BR')}</p>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          {/* Botão de Compra */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handlePurchase}
              className={`px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 ${
                purchaseLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={purchaseLoading}
            >
              {purchaseLoading ? 'Processando...' : 'Comprar'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
