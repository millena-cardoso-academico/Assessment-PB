import React from 'react';
import { Link } from 'react-router-dom';

function HowItWorks() {
  return (
    <div className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 p-8 rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold mb-6 text-center">Como funciona</h1>
      
      <p className="text-lg mb-6">
        Digilix é um cinema virtual, onde você reserva seus ingressos para os horários disponíveis em qualquer dia que você desejar. No horário da sessão, os espectadores têm a oportunidade de interagir entre si por meio de um chat virtual em tempo real.
      </p>
      
      <p className="text-lg mb-6">
        É a oportunidade perfeita para quem deseja conhecer pessoas que compartilham o amor por filmes sem sair do conforto de sua casa! Basta se registrar, logar e escolher um plano de assinatura:
      </p>
      
      {/* Seção de Planos */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Nossos Planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Plano Standard */}
          <div className="bg-gray-700 dark:bg-gray-300 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">Standard</h3>
            <p className="mb-4">Preço: R$ 9,99</p>
          </div>

          {/* Plano Premium */}
          <div className="bg-gray-700 dark:bg-gray-300 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2">Premium</h3>
            <p className="mb-4">Preço: R$ 19,99</p>
          </div>

        </div>
      </div>

      {/* Chamada para Ação */}
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white dark:text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Comece Agora
        </Link>
      </div>
    </div>
  );
}

export default HowItWorks;
