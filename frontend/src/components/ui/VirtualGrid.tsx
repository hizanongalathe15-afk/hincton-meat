import { useEffect, useRef, useState } from 'react'

interface VirtualGridProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
  gap?: number
  columns?: number
}

export const VirtualGrid = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem, 
  gap = 16,
  columns = 4 
}: VirtualGridProps) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight })
  const containerRef = useRef<HTMLDivElement>(null)

  const rowHeight = itemHeight + gap
  const itemsPerRow = columns
  const totalRows = Math.ceil(items.length / itemsPerRow)
  const totalHeight = totalRows * rowHeight

  const visibleRows = Math.ceil(containerSize.height / rowHeight) + 2
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1)
  const endRow = Math.min(totalRows, startRow + visibleRows)

  const visibleItems = items.slice(startRow * itemsPerRow, endRow * itemsPerRow)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    const handleResize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight
      })
    }

    container.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        height: containerSize.height,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const globalIndex = startRow * itemsPerRow + index
          const rowIndex = Math.floor(globalIndex / itemsPerRow)
          const colIndex = globalIndex % itemsPerRow
          const itemWidth = (containerSize.width - gap * (columns - 1)) / columns

          return (
            <div
              key={item.id || globalIndex}
              style={{
                position: 'absolute',
                top: rowIndex * rowHeight,
                left: colIndex * (itemWidth + gap),
                width: itemWidth,
                height: itemHeight
              }}
            >
              {renderItem(item, globalIndex)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualGrid
