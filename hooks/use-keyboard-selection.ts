import { useState } from "react"
import type { KeyboardEvent } from "react"

export function useKeyboardSelection<T>(items: T[], onSelect: (item: T) => void) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % items.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      onSelect(items[activeIndex >= 0 && activeIndex < items.length ? activeIndex : 0])
      setActiveIndex(-1)
    }
  }

  return { activeIndex, onKeyDown, reset: () => setActiveIndex(-1) }
}
