import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/currency';
import { cartApi } from '../services/buyerApi';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  subCategory: string;
  inStock: boolean;
  stockQuantity: number;
  weight: {
    min: number;
    max: number;
    unit: string;
  };
  nutritionalInfo?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  storageInstructions: string;
  shelfLife: string;
  isHalal: boolean;
  isOrganic: boolean;
}

const ProductDetailPage: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Mock product data - replace with API call
    const mockProduct: Product = {
      id: id || '1',
      name: 'Premium Beef Ribeye',
      price: 2500,
      originalPrice: 3000,
      description: 'Premium quality beef ribeye steak, perfectly marbled for exceptional flavor and tenderness. Sourced from grass-fed cattle.',
      images: [
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
        'https://images.unsplash.com/photo-1603048297172-c9252a76480a?w=800',
        'https://images.unsplash.com/photo-1596797048544-cc6c9995b0d0?w=800'
      ],
      category: 'Beef',
      subCategory: 'Steaks',
      inStock: true,
      stockQuantity: 50,
      weight: {
        min: 0.5,
        max: 2,
        unit: 'KG'
      },
      nutritionalInfo: {
        calories: 250,
        protein: 26,
        fat: 15,
        carbs: 0
      },
      storageInstructions: 'Store in refrigerator at 1-4°C. Use within 3-5 days or freeze for up to 6 months.',
      shelfLife: '3-5 days refrigerated, 6 months frozen',
      isHalal: true,
      isOrganic: false
    };

    setTimeout(() => {
      setProduct(mockProduct);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || isAdding) return;

    setIsAdding(true)
    try {
      await cartApi.addToCart({ productId: product.id, quantity })
      toast.success(`${product.name} added to cart!`)
    } catch (error) {
      console.error('Failed to add product to cart:', error)
      toast.error('Failed to add this product to your cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    await handleAddToCart();
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <button
            onClick={() => navigate('/shop')}
            className="text-red-600 hover:text-red-700"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-white">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-red-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <button className="p-2 rounded-lg hover:bg-gray-100">
                  <Heart className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">4.8 (124 reviews)</span>
                </div>
                <div className="flex items-center space-x-2">
                  {product.isHalal && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Halal
                    </span>
                  )}
                  {product.isOrganic && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Organic
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Save {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
              </p>
            </div>

            <div className="prose prose-sm text-gray-600">
              <p>{product.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight ({product.weight.unit})
                </label>
                <input
                  type="range"
                  min={product.weight.min}
                  max={product.weight.max}
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{product.weight.min} {product.weight.unit}</span>
                  <span>{weight} {product.weight.unit}</span>
                  <span>{product.weight.max} {product.weight.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:opacity-80"
              >
                {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                <span>{isAdding ? 'Adding...' : t('productDetail.addToCart')}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">{t('productDetail.freeDelivery')}</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">{t('productDetail.qualityGuaranteed')}</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">{t('productDetail.easyReturns')}</p>
              </div>
            </div>

            {product.nutritionalInfo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('productDetail.nutritionalInformation')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('productDetail.calories')}</span>
                    <span className="ml-2 font-medium">{product.nutritionalInfo.calories}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('productDetail.protein')}</span>
                    <span className="ml-2 font-medium">{product.nutritionalInfo.protein}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('productDetail.fat')}</span>
                    <span className="ml-2 font-medium">{product.nutritionalInfo.fat}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('productDetail.carbs')}</span>
                    <span className="ml-2 font-medium">{product.nutritionalInfo.carbs}g</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{t('productDetail.storageShelfLife')}</h3>
              <p className="text-sm text-gray-600 mb-2">{product.storageInstructions}</p>
              <p className="text-sm text-gray-600">
                <strong>{t('productDetail.shelfLife')}</strong> {product.shelfLife}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
