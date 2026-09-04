import { createContext, useContext, useEffect } from "react"

type ThemeProviderState = {
  resolvedTheme: "dark"
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  resolvedTheme: "dark",
})

// The app is dark-only - no theme toggle is exposed anywhere, so this just
// pins the "dark" class on <html> and exposes resolvedTheme for components
// (e.g. Logo) that need to pick between light/dark asset variants.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <ThemeProviderContext.Provider value={{ resolvedTheme: "dark" }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeProviderContext)
