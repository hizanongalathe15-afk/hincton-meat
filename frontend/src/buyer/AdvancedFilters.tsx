import { useState } from 'react'
import { 
  Filter, 
  ChefHat, 
  Heart, 
  Scale,
  Clock,
  Globe,
  Star,
  Sparkles,
  Check,
  Package
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface FilterOption {
  id: string
  label: string
  icon?: any
  description?: string
}

interface FilterSection {
  id: string
  title: string
  icon: any
  options: FilterOption[]
  type: 'checkbox' | 'radio'
}

interface AdvancedFiltersProps {
  onFiltersChange?: (filters: any) => void
  activeFilters?: any
}

const AdvancedFilters = ({ onFiltersChange, activeFilters = {} }: AdvancedFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState(new Set<string>(['dietary', 'cooking']))
  type SelectedFilters = Record<string, string[] | string | undefined>
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(activeFilters)
  const { t } = useLanguage()

  const filterSections: FilterSection[] = [
    {
      id: 'dietary',
      title: t('filters.dietaryPreferences'),
      icon: Heart,
      type: 'checkbox',
      options: [
        { id: 'halal', label: t('filters.halalCertified'), description: t('filters.halalDescription') },
        { id: 'organic', label: t('filters.organic'), description: t('filters.organicDescription') },
        { id: 'grass-fed', label: t('filters.grassFed'), description: t('filters.grassFedDescription') },
        { id: 'free-range', label: t('filters.freeRange'), description: t('filters.freeRangeDescription') },
        { id: 'non-gmo', label: t('filters.nonGmo'), description: t('filters.nonGmoDescription') },
        { id: 'gluten-free', label: t('filters.glutenFree'), description: t('filters.glutenFreeDescription') }
      ]
    },
    {
      id: 'cooking',
      title: t('filters.cookingMethod'),
      icon: ChefHat,
      type: 'checkbox',
      options: [
        { id: 'grilling', label: t('filters.grilling'), description: t('filters.grillingDescription') },
        { id: 'roasting', label: t('filters.roasting'), description: t('filters.roastingDescription') },
        { id: 'stewing', label: t('filters.stewing'), description: t('filters.stewingDescription') },
        { id: 'frying', label: t('filters.frying'), description: t('filters.fryingDescription') },
        { id: 'smoking', label: t('filters.smoking'), description: t('filters.smokingDescription') },
        { id: 'sous-vide', label: t('filters.sousVide'), description: t('filters.sousVideDescription') }
      ]
    },
    {
      id: 'occasion',
      title: t('filters.occasion'),
      icon: Sparkles,
      type: 'radio',
      options: [
        { id: 'everyday', label: t('filters.everydayMeals'), description: t('filters.everydayMealsDescription') },
        { id: 'special', label: t('filters.specialOccasions'), description: t('filters.specialOccasionsDescription') },
        { id: 'bbq', label: t('filters.bbqParties'), description: t('filters.bbqPartiesDescription') },
        { id: 'festive', label: t('filters.festiveSeason'), description: t('filters.festiveSeasonDescription') },
        { id: 'healthy', label: t('filters.healthyLiving'), description: t('filters.healthyLivingDescription') },
        { id: 'gourmet', label: t('filters.gourmetDining'), description: t('filters.gourmetDiningDescription') }
      ]
    },
    {
      id: 'quality',
      title: t('filters.qualityGrade'),
      icon: Star,
      type: 'radio',
      options: [
        { id: 'premium', label: t('filters.premiumGrade'), description: t('filters.premiumGradeDescription') },
        { id: 'select', label: t('filters.selectGrade'), description: t('filters.selectGradeDescription') },
        { id: 'standard', label: t('filters.standardGrade'), description: t('filters.standardGradeDescription') },
        { id: 'economy', label: t('filters.economyGrade'), description: t('filters.economyGradeDescription') }
      ]
    },
    {
      id: 'origin',
      title: t('filters.origin'),
      icon: Globe,
      type: 'checkbox',
      options: [
        { id: 'local', label: t('filters.localKenyan'), description: t('filters.localKenyanDescription') },
        { id: 'imported', label: t('filters.imported'), description: t('filters.importedDescription') },
        { id: 'wagyu', label: t('filters.wagyu'), description: t('filters.wagyuDescription') },
        { id: 'european', label: t('filters.european'), description: t('filters.europeanDescription') },
        { id: 'south-american', label: t('filters.southAmerican'), description: t('filters.southAmericanDescription') },
        { id: 'african', label: t('filters.african'), description: t('filters.africanDescription') }
      ]
    },
    {
      id: 'preparation',
      title: t('filters.preparation'),
      icon: Clock,
      type: 'radio',
      options: [
        { id: 'quick', label: t('filters.quickCook'), description: t('filters.quickCookDescription') },
        { id: 'medium', label: t('filters.mediumCook'), description: t('filters.mediumCookDescription') },
        { id: 'slow', label: t('filters.slowCook'), description: t('filters.slowCookDescription') },
        { id: 'ready-to-eat', label: t('filters.readyToEat'), description: t('filters.readyToEatDescription') }
      ]
    },
    {
      id: 'packaging',
      title: t('filters.packaging'),
      icon: Package,
      type: 'checkbox',
      options: [
        { id: 'vacuum-sealed', label: t('filters.vacuumSealed'), description: t('filters.vacuumSealedDescription') },
        { id: 'frozen', label: t('filters.frozen'), description: t('filters.frozenDescription') },
        { id: 'fresh', label: t('filters.fresh'), description: t('filters.freshDescription') },
        { id: 'marinated', label: t('filters.preMarinated'), description: t('filters.preMarinatedDescription') },
        { id: 'portioned', label: t('filters.portionPack'), description: t('filters.portionPackDescription') },
        { id: 'bulk', label: t('filters.bulkPack'), description: t('filters.bulkPackDescription') }
      ]
    },
    {
      id: 'nutritional',
      title: t('filters.nutritionalFocus'),
      icon: Scale,
      type: 'checkbox',
      options: [
        { id: 'low-fat', label: t('filters.lowFat'), description: t('filters.lowFatDescription') },
        { id: 'high-protein', label: t('filters.highProtein'), description: t('filters.highProteinDescription') },
        { id: 'low-carb', label: t('filters.lowCarb'), description: t('filters.lowCarbDescription') },
        { id: 'lean', label: t('filters.leanCuts'), description: t('filters.leanCutsDescription') },
        { id: 'iron-rich', label: t('filters.ironRich'), description: t('filters.ironRichDescription') },
        { id: 'omega-3', label: t('filters.omega3'), description: t('filters.omega3Description') }
      ]
    }
  ]

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleFilterChange = (sectionId: string, optionId: string, type: 'checkbox' | 'radio') => {
    const newFilters = { ...selectedFilters }
    
    if (type === 'checkbox') {
      const current = newFilters[sectionId]
      const currentArr = Array.isArray(current) ? current : []

      if (currentArr.includes(optionId)) {
        newFilters[sectionId] = currentArr.filter((id: string) => id !== optionId)
      } else {
        newFilters[sectionId] = [...currentArr, optionId]
      }
    } else {
      newFilters[sectionId] = optionId
    }
    
    setSelectedFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearAllFilters = () => {
    setSelectedFilters({})
    onFiltersChange?.({})
  }

  const getActiveFilterCount = () => {
    const values = Object.values(selectedFilters)

    return values.reduce((count, filters) => {
      if (Array.isArray(filters)) return count + filters.length
      if (filters) return count + 1
      return count
    }, 0)
  }

  const isFilterSelected = (sectionId: string, optionId: string) => {
    const sectionFilters = selectedFilters[sectionId]
    if (Array.isArray(sectionFilters)) {
      return sectionFilters.includes(optionId)
    }
    return sectionFilters === optionId
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">{t('filters.advancedFilters')}</h2>
          {getActiveFilterCount() > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {t('filters.clearAll')}
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div className="space-y-4">
        {filterSections.map((section) => {
          const Icon = section.icon
          const isExpanded = expandedSections.has(section.id)
          const sectionFilters = selectedFilters[section.id]
          const hasActiveFilters = sectionFilters && (
            Array.isArray(sectionFilters) ? sectionFilters.length > 0 : true
          )

          return (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${hasActiveFilters ? 'text-red-600' : 'text-gray-600'}`} />
                  <span className={`font-medium ${hasActiveFilters ? 'text-red-600' : 'text-gray-900'}`}>
                    {section.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <span className="text-xs text-red-600 font-medium">
                      {Array.isArray(sectionFilters) ? sectionFilters.length : 1} {t('filters.selected')}
                    </span>
                  )}
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {section.options.map((option) => {
                    const isSelected = isFilterSelected(section.id, option.id)
                    
                    return (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type={section.type}
                          name={`${section.id}-filter`}
                          checked={isSelected}
                          onChange={() => handleFilterChange(section.id, option.id, section.type)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                              {option.label}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-green-600" />}
                          </div>
                          {option.description && (
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Apply common filter combinations
              const quickFilters = {
                dietary: ['organic', 'halal'],
                quality: 'premium',
                cooking: ['grilling', 'roasting']
              }
              setSelectedFilters(quickFilters)
              onFiltersChange?.(quickFilters)
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Premium Selection
          </button>
          <button
            onClick={() => {
              const quickFilters = {
                dietary: ['halal'],
                origin: 'local',
                nutritional: ['lean']
              }
              setSelectedFilters(quickFilters)
              onFiltersChange?.(quickFilters)
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Healthy Choice
          </button>
          <button
            onClick={() => {
              const quickFilters = {
                occasion: 'bbq',
                cooking: ['grilling', 'smoking'],
                packaging: ['fresh']
              }
              setSelectedFilters(quickFilters)
              onFiltersChange?.(quickFilters)
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            BBQ Party
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdvancedFilters
