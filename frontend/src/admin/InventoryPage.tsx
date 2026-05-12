import InventoryManager from './InventoryManager'

interface InventoryPageProps {
  onEditItem?: (item: any) => void
  onDeleteItem?: (itemId: string) => void
  onRestockItem?: (itemId: string, quantity: number) => void
  onAddNewItem?: () => void
}

const InventoryPage = ({ 
  onEditItem, 
  onDeleteItem, 
  onRestockItem, 
  onAddNewItem 
}: InventoryPageProps) => {
  const handleEdit = (item: any) => {
    console.log('Edit inventory item:', item)
    onEditItem?.(item)
  }

  const handleDelete = (itemId: string) => {
    console.log('Delete inventory item:', itemId)
    onDeleteItem?.(itemId)
  }

  const handleRestock = (itemId: string, quantity: number) => {
    console.log('Restock item:', itemId, quantity)
    onRestockItem?.(itemId, quantity)
  }

  const handleAddNew = () => {
    console.log('Add new inventory item')
    onAddNewItem?.()
  }

  return (
    <div className="p-6">
      <InventoryManager
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestock={handleRestock}
        onAddNew={handleAddNew}
      />
    </div>
  )
}

export default InventoryPage
