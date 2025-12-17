import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getProfileImageUrl } from "@/lib/api"

interface ComboboxOption {
  value: string
  label: string
  imageUrl?: string | null
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-black/40 border-gold/40 text-white hover:bg-black/60",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption?.imageUrl && (
              <img
                src={getProfileImageUrl(selectedOption.imageUrl)}
                alt={selectedOption.label}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            )}
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-black border-gold/40" 
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center border-b border-gold/20 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-gold-light" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-white placeholder:text-white/50 outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false)
              }
            }}
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/70">
              No se encontraron resultados
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gold/20 focus:bg-gold/20 text-white",
                  value === option.value && "bg-gold/30"
                )}
                onClick={() => {
                  onValueChange(option.value)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 flex-shrink-0",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.imageUrl && (
                  <img
                    src={getProfileImageUrl(option.imageUrl)}
                    alt={option.label}
                    className="w-6 h-6 rounded-full object-cover mr-2 flex-shrink-0"
                  />
                )}
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

