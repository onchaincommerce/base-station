'use client';

import { useState } from 'react';
import { Checkout, CheckoutButton, CheckoutStatus } from '@coinbase/onchainkit/checkout';
import { products } from '@/lib/products';
import { motion } from 'framer-motion';
import FloatingLogos from '@/components/FloatingLogos';

const GlowingTitle = () => {
  return (
    <div className="flex justify-center w-full">
      <motion.div
        className="relative inline-block"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur-lg opacity-0 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <h1 className="relative text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl group">
          <span className="text-white group-hover:text-blue-100 transition-colors duration-200">
            Base
          </span>
          <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-blue-400 transition-all duration-200 ml-2">
            Station
          </span>
        </h1>
      </motion.div>
    </div>
  );
};

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [taxAmount, setTaxAmount] = useState<number | null>(null);
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [showZipForm, setShowZipForm] = useState(false);
  const [calculatedTax, setCalculatedTax] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProductSelect = (productId: string) => {
    if (selectedProduct === productId && showZipForm) {
      return;
    }
    setZipCode('');
    setTaxAmount(null);
    setTaxRate(null);
    setTotalAmount(null);
    setCalculatedTax(false);
    setSelectedProduct(productId);
    setShowZipForm(true);
  };

  const calculateTaxForProduct = async () => {
    try {
      const response = await fetch('/api/calculate-tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct,
          zipCode
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to calculate tax');
      }

      setTaxRate(data.taxRate);
      setTaxAmount(data.taxAmount);
      setTotalAmount(data.totalAmount);
      setCalculatedTax(true);
    } catch (error) {
      console.error('Tax calculation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to calculate tax');
    }
  };

  const chargeHandler = async () => {
    if (!selectedProduct || !totalAmount || !taxAmount) {
      throw new Error('Please calculate tax first');
    }

    try {
      console.log('Creating charge:', {
        productId: selectedProduct,
        totalAmount,
        taxAmount
      });

      const response = await fetch('/api/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct,
          totalAmount,
          taxAmount
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create charge');
      }

      const data = await response.json();
      console.log('Charge created:', data);
      return data.chargeId;
    } catch (error) {
      console.error('Error creating charge:', error);
      throw error;
    }
  };

  const handlePaymentDetected = async (chargeId: string) => {
    console.log('💰 Payment detected for charge:', chargeId);
    setIsLoading(true);
    
    try {
      const pollForDownload = async () => {
        const response = await fetch(`/api/check-charge-status?chargeId=${chargeId}`);
        const data = await response.json();
        
        if (data.downloadUrl) {
          console.log('🎉 Download URL received!');
          setDownloadUrl(data.downloadUrl);
          return true;
        }
        return false;
      };

      let found = await pollForDownload();
      
      if (!found) {
        const interval = setInterval(async () => {
          found = await pollForDownload();
          if (found) {
            clearInterval(interval);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(interval);
        }, 30000);
      }
    } catch (error) {
      console.error('❌ Error checking charge status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <FloatingLogos />
      
      {/* Hero Section - Simplified with reduced spacing */}
      <div className="relative px-4 py-8 sm:px-6 sm:py-12 lg:py-16 lg:px-8">
        <GlowingTitle />
        <p className="mx-auto mt-4 max-w-lg text-center text-xl text-gray-300 sm:max-w-3xl">
          Premium files to make you based
        </p>
      </div>

      {/* Products Grid with reduced top spacing */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative group max-w-2xl w-full"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-gray-900 rounded-xl p-8 shadow-2xl">
                {/* Product Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {product.title}
                    </h2>
                    <p className="text-gray-400 mt-2">{product.preview}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-full">
                    <span className="text-blue-400 font-medium">{product.fileType.toUpperCase()}</span>
                    <span className="text-sm text-gray-400">{product.fileSize}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">INCLUDES</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center text-gray-300 group-hover:text-gray-200"
                      >
                        <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Purchase Section */}
                <div className="mt-8">
                  {downloadUrl && selectedProduct === product.id ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Files
                    </motion.button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Base Price:</span>
                        <span className="text-2xl font-bold text-blue-400">
                          ${product.price.toFixed(2)} USD
                        </span>
                      </div>

                      {/* Tax Details */}
                      {selectedProduct === product.id && calculatedTax && taxAmount !== null && taxRate !== null && totalAmount !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Tax Rate:</span>
                            <span className="text-gray-300">{taxRate.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Tax Amount:</span>
                            <span className="text-gray-300">${taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-gray-800 my-2"></div>
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-300">Total:</span>
                            <span className="text-blue-400">${totalAmount.toFixed(2)} USD</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Zip Code Form */}
                      {showZipForm && selectedProduct === product.id ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex flex-col space-y-2">
                            <input
                              type="text"
                              placeholder="Enter Zip Code"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              className="bg-gray-800 border border-gray-700 text-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                              required
                            />
                          </div>
                          {zipCode && !calculatedTax && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={calculateTaxForProduct}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg shadow-green-500/25"
                            >
                              Calculate Tax
                            </motion.button>
                          )}
                          {calculatedTax && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-gray-800/50 p-4 rounded-lg border border-gray-700"
                            >
                              <Checkout 
                                chargeHandler={chargeHandler}
                                onPaymentDetected={handlePaymentDetected}
                              >
                                <CheckoutButton 
                                  coinbaseBranded 
                                  text="Proceed to Checkout"
                                />
                                <CheckoutStatus />
                              </Checkout>
                            </motion.div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleProductSelect(product.id)}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
                        >
                          Purchase Access
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
        >
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-blue-400">Processing payment...</p>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
