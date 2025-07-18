"use client";

import { useState } from 'react'
import { USDCBalance } from './USDCBalance'
import { ConversionCalculator } from './ConversionCalculator'
import { MPesaForm } from './MPesaForm'
import { useAccount, useChainId } from 'wagmi'
import { getNetworkConfig, isTestnet } from '@/lib/contracts'

interface TransactionResult {
  checkoutRequestID?: string;
  merchantRequestID?: string;
  mpesaReference: string;
  message: string;
  customerMessage?: string;
}

export function OffRampFlow() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [usdcAmount, setUsdcAmount] = useState(0)
  const [kshAmount, setKshAmount] = useState(0)
  const [step, setStep] = useState(1) // 1: Amount, 2: M-Pesa, 3: Processing, 4: Success
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null)
  const [error, setError] = useState('')

  const networkConfig = getNetworkConfig(chainId)
  const isTestnetNetwork = isTestnet(chainId)

  const handleMPesaSubmit = async (mpesaData: { phoneNumber: string; amount: number }) => {
    setStep(3)
    setError('')
    
    try {
      // Submit to your backend API
      const response = await fetch('/api/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          usdcAmount,
          kshAmount,
          phoneNumber: mpesaData.phoneNumber,
          provider: 'mpesa',
          chainId
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setTransactionResult({
          checkoutRequestID: data.checkoutRequestID,
          merchantRequestID: data.merchantRequestID,
          mpesaReference: data.mpesaReference,
          message: data.message,
          customerMessage: data.customerMessage
        })
        setStep(4) // Success step
      } else {
        throw new Error(data.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Off-ramp error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setStep(2) // Back to M-Pesa form
    }
  }

  const resetFlow = () => {
    setStep(1)
    setUsdcAmount(0)
    setKshAmount(0)
    setTransactionResult(null)
    setError('')
  }

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-lg max-w-md w-full">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">Please connect your wallet to start converting USDC to M-Pesa</p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            💡 Make sure you have USDC on {networkConfig.name}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">USDC to M-Pesa</h1>
        <p className="text-gray-600 mt-2">Convert your USDC to Kenyan Shillings instantly</p>
        
        {/* Network indicator */}
        <div className="flex items-center justify-center mt-3 space-x-2">
          <div className={`w-3 h-3 rounded-full ${isTestnetNetwork ? 'bg-orange-500' : 'bg-green-500'}`}></div>
          <span className={`text-sm font-medium ${isTestnetNetwork ? 'text-orange-700' : 'text-green-700'}`}>
            {networkConfig.name} {isTestnetNetwork ? '(Testnet)' : ''}
          </span>
        </div>
      </div>

      {/* Modern Progress indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-3">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  stepNum < step
                    ? 'bg-green-500 text-white shadow-lg'
                    : stepNum === step
                    ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum < step ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-8 h-1 mx-2 rounded-full transition-all duration-300 ${
                  stepNum < step ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-red-800 font-semibold">Transaction Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* USDC Balance */}
      <USDCBalance />
      
      {/* Step 1: Amount Input */}
      {step >= 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Amount to Convert (USDC)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg">$</span>
            </div>
            <input
              type="number"
              value={usdcAmount || ''}
              onChange={(e) => setUsdcAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter USDC amount"
              className="w-full pl-8 pr-4 py-4 text-lg font-medium text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
              min="1"
              max="1000"
              step="0.01"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Minimum: $1 USDC</span>
            <span>Maximum: $1,000 USDC</span>
          </div>
          {usdcAmount > 0 && step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
            >
              Continue to M-Pesa Payment
            </button>
          )}
        </div>
      )}
      
      {/* Step 2: Conversion Calculator */}
      {step >= 2 && usdcAmount > 0 && (
        <ConversionCalculator 
          usdcAmount={usdcAmount} 
          onKshChange={setKshAmount}
        />
      )}
      
      {/* Step 2: M-Pesa Form */}
      {step >= 2 && step < 3 && kshAmount > 0 && (
        <MPesaForm 
          kshAmount={kshAmount}
          onSubmit={handleMPesaSubmit}
        />
      )}
      
      {/* Step 3: Processing */}
      {step === 3 && (
        <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
          <h3 className="text-2xl font-bold text-blue-900 mb-2">Processing M-Pesa Payment</h3>
          <p className="text-blue-700 mb-4">
            Initiating M-Pesa STK push. Please check your phone...
          </p>
          <div className="text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-lg inline-block">
            📱 Please enter your M-Pesa PIN when prompted
          </div>
        </div>
      )}
      
      {/* Step 4: Success */}
      {step === 4 && transactionResult && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              M-Pesa STK Push Sent! 📱
            </h3>
            <p className="text-green-700 text-lg mb-4">
              {transactionResult.message}
            </p>
            {transactionResult.customerMessage && (
              <p className="text-green-600 text-sm bg-green-100 p-3 rounded-lg border border-green-200">
                {transactionResult.customerMessage}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            {transactionResult.checkoutRequestID && (
              <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Checkout Request ID:</span>
                  <span className="font-mono text-green-600 font-semibold text-sm">
                    {transactionResult.checkoutRequestID.slice(-8)}
                  </span>
                </div>
              </div>
            )}
            <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Reference:</span>
                <span className="font-mono text-green-600 font-semibold">
                  {transactionResult.mpesaReference}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Network:</span>
                <span className="font-semibold text-gray-700">
                  {networkConfig.name} {isTestnetNetwork ? '(Testnet)' : ''}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. Check your phone for M-Pesa STK push notification</li>
              <li>2. Enter your M-Pesa PIN to complete the payment</li>
              <li>3. You&apos;ll receive a confirmation SMS with transaction details</li>
            </ol>
          </div>
          
          <button
            onClick={resetFlow}
            className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
          >
            Make Another Transaction
          </button>
        </div>
      )}
      
      {/* Back button for step 2 */}
      {step === 2 && (
        <button
          onClick={() => setStep(1)}
          className="w-full text-gray-600 bg-gray-100 hover:bg-gray-200 p-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      )}
    </div>
  )
} 