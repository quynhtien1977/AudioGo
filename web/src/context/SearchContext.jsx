import { createContext, useState, useCallback } from "react"

export const SearchContext = createContext()

export const SearchProvider = ({ children }) => {
  const [searchFilter, setSearchFilter] = useState({
    query: "",
    pageType: null,
    results: [],
  })

  const updateSearch = useCallback((query, pageType) => {
    setSearchFilter((prev) => ({
      ...prev,
      query,
      pageType,
    }))
  }, [])

  const clearSearch = useCallback(() => {
    setSearchFilter({
      query: "",
      pageType: null,
      results: [],
    })
  }, [])

  return (
    <SearchContext.Provider
      value={{
        searchFilter,
        updateSearch,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
