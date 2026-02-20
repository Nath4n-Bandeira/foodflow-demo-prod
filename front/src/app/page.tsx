"use client";
import React from 'react';

function HeroSection() {
  return (
    <section className="bg-white">
      <div className="relative z-10 flex flex-col items-center justify-center container mx-auto px-6 py-16 md:py-28 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl">
          O controle de estoque,
          <span className="text-green-600"> finalmente simples.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-xl">
          A plataforma inteligente para gerenciar seus inventários sem complicações, economizando tempo e reduzindo o desperdício.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <a href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/40 text-lg w-full sm:w-auto">
            Começar Gratuitamente
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}


function FeaturesSection() {
    const features = [
        {
            icon: (
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            ),
            title: "Inventário Centralizado",
            description: "Visão completa de múltiplos locais em um único dashboard, com dados sincronizados em tempo real."
        },
        {
            icon: (
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
            title: "Gestão de Equipes",
            description: "Controle permissões de acesso e atribua responsabilidades para cada membro do time com facilidade."
        },
        {
            icon: (
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
              </svg>
            ),
            title: "Relatórios Inteligentes",
            description: "Tome decisões baseadas em dados com relatórios de consumo, validade e tendências."
        }
   ];

    return (
        <section id="features" className="bg-slate-50 py-20 md:py-24 border-y border-slate-200">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Controle Total em um Só Lugar</h2>
                    <p className="mt-3 text-lg text-slate-600">As ferramentas que você precisa para transformar dados em decisões inteligentes.</p>
                </div>
                
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map(feature => (
                        <div key={feature.title} className="p-8 text-left bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:border-green-300 transition-all duration-300 transform hover:-translate-y-2">
                            <div className="inline-block p-4 bg-green-100 rounded-xl mb-5">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                            <p className="mt-2 text-slate-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


function TestimonialSection() {
    return (
        <section id="testimonial" className="bg-white py-20 md:py-24">
            <div className="container mx-auto px-6 max-w-4xl text-center">
                <svg className="text-green-200 mx-auto w-12 h-12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
                  <path d="M9.983 3v7.391c0 2.908-2.353 5.261-5.261 5.261h-1.722v-3.444h1.722c1.002 0 1.817-.815 1.817-1.817v-7.391h3.444zm10.017 0v7.391c0 2.908-2.353 5.261-5.261 5.261h-1.722v-3.444h1.722c1.002 0 1.817-.815 1.817-1.817v-7.391h3.444z"/>
                </svg>
                <blockquote className="mt-4 text-2xl font-light text-slate-800 italic">
                    "Finalmente temos uma visão clara de todo o nosso inventário em um só lugar. O FoodFlow é intuitivo, poderoso e se tornou indispensável para a nossa operação."
                </blockquote>
                <cite className="mt-6 block font-semibold text-slate-600 not-italic">
                    - Carla Martins, Diretora de Operações
                </cite>
            </div>
        </section>
    );
}

// --- Componente Principal da Página ---
export default function Home() {
  return (
    <main className="bg-white min-h-screen font-sans text-gray-800">
      <HeroSection />
      <FeaturesSection />
      <TestimonialSection />
    </main>
  )
}
