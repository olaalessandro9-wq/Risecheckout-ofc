import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const provider = searchParams.get('provider');
    const email = searchParams.get('email');
    const userId = searchParams.get('user_id');

    // Notificar a janela pai (opener)
    if (window.opener) {
      window.opener.postMessage(
        {
          type: `${provider}_oauth_success`,
          data: {
            email,
            user_id: userId,
          },
        },
        '*'
      );

      // Fechar a janela após 2 segundos
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes checkDraw {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        
        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: checkDraw 0.6s ease-out 0.2s forwards;
        }
        
        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="animate-fade-in w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
          {/* Ícone de Sucesso */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[#00FF41]/10 flex items-center justify-center">
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="check-path"
                  d="M5 13l4 4L19 7"
                  stroke="#00FF41"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          
          {/* Título */}
          <h1 className="text-3xl font-bold text-white text-center mb-3">
            Conectado
          </h1>
          
          {/* Descrição */}
          <p className="text-[#A0A0A0] text-center text-sm mb-8">
            Sua conta foi vinculada com sucesso
          </p>
          
          {/* Divider */}
          <div className="w-full h-px bg-[#2A2A2A] mb-6"></div>
          
          {/* Status */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#00FF41] pulse-dot"></div>
            <span className="text-[#A0A0A0] text-xs">
              Fechando automaticamente...
            </span>
          </div>
          
          {/* Botão */}
          <button
            onClick={() => window.close()}
            className="w-full bg-[#00FF41] hover:brightness-110 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Fechar Janela
          </button>
        </div>
        
        {/* Badge de Segurança */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[#666666] text-xs">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Conexão segura</span>
        </div>
      </div>
    </div>
  );
}
