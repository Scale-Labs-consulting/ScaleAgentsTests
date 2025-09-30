'use client'

import { useState } from 'react'

export default function ROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [averageDealSize, setAverageDealSize] = useState(0)
  const [currentCloseRate, setCurrentCloseRate] = useState(0)
  const [numberOfSalesReps, setNumberOfSalesReps] = useState(0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate ROI based on inputs
  const calculateROI = () => {
    if (monthlyRevenue > 0 && averageDealSize > 0 && currentCloseRate > 0 && numberOfSalesReps > 0) {
      // Realistic close rate increase based on AI assistance
      const calculateCloseRateIncrease = () => {
        // More realistic improvements based on industry standards
        // Normal close rates are 15-20%, so we use conservative but meaningful improvements
        
        let baseImprovement = 0
        
        if (currentCloseRate < 10) {
          // Very low performers can see significant improvement
          baseImprovement = 8
        } else if (currentCloseRate < 15) {
          // Low performers see good improvement
          baseImprovement = 6
        } else if (currentCloseRate < 25) {
          // Average performers see moderate improvement
          baseImprovement = 4
        } else if (currentCloseRate < 35) {
          // Good performers see smaller improvement
          baseImprovement = 3
        } else {
          // High performers see minimal improvement
          baseImprovement = 2
        }
        
        // Add variance based on deal size (larger deals = more complex = more AI value)
        const dealSizeMultiplier = averageDealSize > 10000 ? 1.1 : averageDealSize > 5000 ? 1.05 : 1.0
        
        const avgImprovement = baseImprovement * dealSizeMultiplier
        const minImprovement = Math.max(1, avgImprovement * 0.8) // Conservative minimum
        const maxImprovement = Math.min(10, avgImprovement * 1.2) // Realistic maximum
        
        return {
          min: Math.round(minImprovement * 10) / 10,
          avg: Math.round(avgImprovement * 10) / 10,
          max: Math.round(maxImprovement * 10) / 10
        }
      }

      const closeRateIncrease = calculateCloseRateIncrease()

      // Calculate current deals per month
      const currentDealsPerMonth = monthlyRevenue / averageDealSize
      
      // Calculate total deals worked on (deals closed ÷ close rate)
      const totalDealsWorkedOn = currentDealsPerMonth / (currentCloseRate / 100)
      
      // Calculate additional deals with improved close rate
      const newCloseRate = currentCloseRate + closeRateIncrease.avg
      const newDealsClosed = totalDealsWorkedOn * (newCloseRate / 100)
      const additionalDeals = Math.round(newDealsClosed - currentDealsPerMonth)
      
      // Monthly investment: €64 per sales rep
      const monthlyInvestment = numberOfSalesReps * 64
      
      // Monthly revenue increase from additional deals
      const monthlyRevenueIncrease = additionalDeals * averageDealSize
      
      // Annual calculations
      const annualRevenueGain = monthlyRevenueIncrease * 12
      const perRepAnnualROI = numberOfSalesReps > 0 ? annualRevenueGain / numberOfSalesReps : 0

      return {
        closeRateIncrease,
        additionalDeals,
        monthlyInvestment,
        monthlyRevenueIncrease,
        annualRevenueGain,
        perRepAnnualROI
      }
    }
    
    return {
      closeRateIncrease: { min: 0, avg: 0, max: 0 },
      additionalDeals: 0,
      monthlyInvestment: 0,
      monthlyRevenueIncrease: 0,
      annualRevenueGain: 0,
      perRepAnnualROI: 0
    }
  }

  const roi = calculateROI()

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Quanto Crescimento Estás a Perder?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Uma hora por dia de treino com os nossos agentes IA mostra uma melhoria real no desempenho comercial geral
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Input Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Preenche as tuas informações abaixo
              </h3>
              
              <div className="space-y-6">
                {/* Monthly Revenue */}
                <div>
                  <label className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Receita Mensal
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base">€</span>
                    <input
                      type="number"
                      value={monthlyRevenue || ''}
                      onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Average Deal Size */}
                <div>
                  <label className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Tamanho Médio do Negócio
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base">€</span>
                    <input
                      type="number"
                      value={averageDealSize || ''}
                      onChange={(e) => setAverageDealSize(Number(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 text-base border border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Current Close Rate */}
                <div>
                  <label className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Taxa de Fechamento Atual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentCloseRate || ''}
                      onChange={(e) => setCurrentCloseRate(Number(e.target.value) || 0)}
                      className="w-full pl-4 pr-10 py-3 text-base border border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base">%</span>
                  </div>
                </div>

                {/* Number of Sales Reps */}
                <div>
                  <label className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Número de Vendedores
                  </label>
                  <input
                    type="number"
                    value={numberOfSalesReps || ''}
                    onChange={(e) => setNumberOfSalesReps(Number(e.target.value) || 0)}
                    className="w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                O Teu ROI Potencial
              </h3>
              
              <div className="space-y-4">
                {/* Close Rate Increase */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                    Aumento da Taxa de Fechamento com ScaleAgents
                  </h4>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {currentCloseRate}% → {Math.round(currentCloseRate + roi.closeRateIncrease.min)}% - {Math.round(currentCloseRate + roi.closeRateIncrease.max)}%
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {roi.additionalDeals} negócios adicionais por mês
                  </p>
                </div>

                {/* Monthly Investment */}
                <div className="p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                    Investimento Mensal
                  </h4>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {formatCurrency(roi.monthlyInvestment)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {numberOfSalesReps} vendedores × €64/mês
                  </p>
                </div>

                {/* Monthly Revenue Increase */}
                <div className="p-6 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg">
                  <h4 className="text-base font-semibold mb-3">
                    Aumento Total da Receita Mensal
                  </h4>
                  <div className="text-2xl font-bold mb-2">
                    {formatCurrency(roi.monthlyRevenueIncrease)}
                  </div>
                  <p className="text-purple-100 text-sm">
                    {formatCurrency(monthlyRevenue + roi.monthlyRevenueIncrease)} receita mensal total
                  </p>
                </div>

                {/* Annual Revenue Gain */}
                <div className="p-6 bg-gradient-to-r from-purple-700 to-violet-700 text-white rounded-lg">
                  <h4 className="text-base font-semibold mb-3">
                    Ganho Total de Receita Anual
                  </h4>
                  <div className="text-2xl font-bold mb-2">
                    {formatCurrency(roi.annualRevenueGain)}
                  </div>
                  <p className="text-purple-100 text-sm">
                    {formatCurrency(roi.perRepAnnualROI)} ROI anual por vendedor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Todos os cálculos baseados em vendedores treinando uma hora por dia com os agentes de IA da Scale Labs durante 22 dias por mês. 
              Os nossos dados sugerem que o treino com os agentes de IA uma hora por dia pode aumentar o desempenho em 5-10% no mínimo. Investimento baseado no Plano Pro (€64/mês por vendedor).
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}