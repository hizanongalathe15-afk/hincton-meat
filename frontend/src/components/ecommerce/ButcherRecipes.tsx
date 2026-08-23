import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Clock, Users, Flame, Plus, Check, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatPrice } from '../../utils/currency'
import { recipesApi } from '../../services/buyerApi'
import { Product } from '../../types'
import toast from 'react-hot-toast'

interface Recipe {
  id: string
  title: string
  subtitle: string
  prepTime: string
  cookTime: string
  servings: string
  difficulty: string
  featuredCut: {
    name: string
    category: string
    price: number
    weight: string
    image: string
  }
  productId: string | null
  ingredients: string[]
  instructions: string[]
  tags: string[]
}

interface ButcherRecipesProps {
  onAddToCart?: (product: Product, quantity: number) => Promise<void>
}

export const ButcherRecipes: React.FC<ButcherRecipesProps> = ({ onAddToCart }) => {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null)
  const [addedCutId, setAddedCutId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    recipesApi
      .list()
      .then((data) => {
        const list = data.recipes || []
        setRecipes(list)
        if (list.length > 0) setActiveRecipeId(list[0].id)
      })
      .catch(() => {
        toast.error('Could not load recipes right now')
      })
      .finally(() => setLoading(false))
  }, [])

  const activeRecipe = recipes.find((r) => r.id === activeRecipeId) || recipes[0]

  const handleAddMeatToCart = async (recipe: Recipe) => {
    if (adding) return
    if (!recipe.productId) {
      toast('This cut is available in our shop — taking you there.')
      navigate(`/shop?category=${encodeURIComponent(recipe.featuredCut.category)}&q=${encodeURIComponent(recipe.featuredCut.name.split(' ')[0])}`)
      return
    }
    if (!onAddToCart) return
    setAdding(true)
    const productLike: Product = {
      id: recipe.productId,
      name: recipe.featuredCut.name,
      price: recipe.featuredCut.price,
      image: recipe.featuredCut.image,
      images: [recipe.featuredCut.image],
      rating: 5,
      reviews: 0,
      category: recipe.featuredCut.category,
      inStock: true,
      stockQuantity: 50,
      description: `Freshly prepared cut for ${recipe.title}`,
      weight: recipe.featuredCut.weight,
      origin: 'Hincton Meat Products',
    }
    try {
      await onAddToCart(productLike, 1)
      setAddedCutId(recipe.id)
      setTimeout(() => setAddedCutId(null), 3000)
    } catch {
      toast.error('Could not add this cut to your cart. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <section className="relative bg-stone-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-pulse">
            <div className="h-6 w-56 mx-auto rounded-full bg-stone-200 mb-4" />
            <div className="h-9 w-3/4 mx-auto rounded bg-stone-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl border border-stone-200 bg-white animate-pulse" />
            ))}
          </div>
          <div className="h-96 rounded-3xl border border-stone-200/80 bg-white animate-pulse" />
        </div>
      </section>
    )
  }

  if (!activeRecipe) {
    return (
      <section className="relative bg-stone-50 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-700 mb-3">
            <UtensilsCrossed className="h-4 w-4" /> Butcher’s Kitchen Inspiration
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-950">
            From the Butcher’s Block to Your Table
          </h2>
          <p className="mt-3 text-gray-600">Recipes are being freshly prepared — check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative bg-stone-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-700 mb-3">
            <UtensilsCrossed className="h-4 w-4" /> Butcher’s Kitchen Inspiration
          </div>
          <h2 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl tracking-tight text-gray-950">
            From the Butcher’s Block to Your Table
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            Tried-and-tested culinary recipes. Add the exact fresh cut to your cart with 1 click.
          </p>
        </div>

        {/* Recipe Cards Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {recipes.map((recipe) => {
            const isSelected = recipe.id === activeRecipe.id
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => setActiveRecipeId(recipe.id)}
                className={`p-5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-red-600 bg-white shadow-xl ring-2 ring-red-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-red-600">{recipe.difficulty}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.cookTime}</span>
                  </div>
                  <h3 className={`font-bold text-base leading-snug ${isSelected ? 'text-red-700' : 'text-gray-900'}`}>
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{recipe.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>{recipe.featuredCut.name.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="font-bold text-gray-900">{formatPrice(recipe.featuredCut.price)}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Active Recipe Detail & Buy Cut Box */}
        <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Recipe Content */}
            <div className="p-6 sm:p-10 lg:col-span-7 space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {activeRecipe.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-950">{activeRecipe.title}</h3>
                <p className="mt-2 text-sm sm:text-base text-gray-600">{activeRecipe.subtitle}</p>
              </div>

              {/* Quick Meta */}
              <div className="flex flex-wrap items-center gap-6 py-3 border-y border-stone-100 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span>Prep: <strong>{activeRecipe.prepTime}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span>Cook: <strong>{activeRecipe.cookTime}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Serves: <strong>{activeRecipe.servings}</strong></span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Ingredients:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                  {activeRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Method */}
              <div>
                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Preparation Steps:</h4>
                <ol className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                  {activeRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right Featured Cut Shopping Callout */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 p-6 sm:p-10 lg:col-span-5 text-white flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-600/30 px-3 py-1 text-xs font-bold text-red-300 border border-red-500/30 mb-4">
                  <ShoppingBag className="h-3.5 w-3.5" /> Featured Fresh Cut
                </div>
                <h4 className="text-xl font-extrabold text-white">{activeRecipe.featuredCut.name}</h4>
                <p className="text-xs text-stone-300 mt-1">Directly portioned and chilled for this recipe.</p>

                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden my-6 border border-white/10 shadow-xl">
                  <img
                    src={activeRecipe.featuredCut.image}
                    alt={activeRecipe.featuredCut.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1.5 border border-white/10 text-right">
                    <span className="text-lg font-black text-amber-300">{formatPrice(activeRecipe.featuredCut.price)}</span>
                    <span className="text-[10px] text-stone-300 block">{activeRecipe.featuredCut.weight}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Temperature controlled at 2°C in insulated box</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Prepared by master butchers within 2 hours of dispatch</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                {activeRecipe.productId ? (
                  <button
                    type="button"
                    onClick={() => handleAddMeatToCart(activeRecipe)}
                    disabled={adding}
                    className={`w-full rounded-2xl py-4 px-6 font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                      addedCutId === activeRecipe.id
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02]'
                    }`}
                  >
                    {addedCutId === activeRecipe.id ? (
                      <>
                        <Check className="h-5 w-5" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" /> Add Meat Cut to Cart ({formatPrice(activeRecipe.featuredCut.price)})
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={`/shop?category=${encodeURIComponent(activeRecipe.featuredCut.category)}&q=${encodeURIComponent(activeRecipe.featuredCut.name.split(' ')[0])}`}
                    className="w-full rounded-2xl py-4 px-6 font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02]"
                  >
                    Shop This Cut ({formatPrice(activeRecipe.featuredCut.price)}) <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ButcherRecipes
