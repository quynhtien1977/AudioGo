import { useNavigate, useLocation } from "react-router-dom"
import { Search, X } from "lucide-react"
import { useState, useEffect, useRef, useContext } from "react"
import { getAllPOIs } from "../api/poiApi"
import { getCategoriesApi } from "../api/categoryApi"
import { getAllToursApi } from "../api/tourApi"
import { getUsersApi } from "../api/accountApi"
import { audioContentApi } from "../api/audioContentApi"
import { SearchContext } from "../context/SearchContext"

export default function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { updateSearch, clearSearch } = useContext(SearchContext)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [allData, setAllData] = useState([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  // Lấy user từ localStorage / sessionStorage
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))

  const role = user?.role 

  // logout
  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate("/")
  }

  // Determine placeholder text based on the current route
  const getPlaceholder = () => {
    if (location.pathname.includes("/poi")) {
      return "Tìm POIs...";
    } else if (location.pathname.includes("/account")) {
      return "Tìm Tài khoản...";
    } else if (location.pathname.includes("/categories")) {
      return "Tìm Thể loại...";
    }else if (location.pathname.includes("/tours")) {
      return "Tìm Tour...";
    }else if (location.pathname.includes("/audio")) {
      return "Tìm Audio...";
    }
    else {
      return "Tìm...";
    }
  }

  // Determine if the search bar should be displayed
  const shouldDisplaySearch = !location.pathname.includes("/dashboard") && 
                             !location.pathname.includes("/access-codes") &&
                             !location.pathname.includes("/poi/management") &&
                             !location.pathname.includes("/tracking")

  // Determine current page type
  const getCurrentPageType = () => {
    if (location.pathname.includes("/poi")) {
      return "poi"
    } else if (location.pathname.includes("/accounts")) {
      return "account"
    } else if (location.pathname.includes("/categories")) {
      return "category"
    } else if (location.pathname.includes("/tours")) {
      return "tour"
    } else if (location.pathname.includes("/audio")) {
      return "audio"
    }
    return null
  }

  // Fetch data based on current page
  useEffect(() => {
    const fetchData = async () => {
      if (!shouldDisplaySearch) return

      try {
        setIsLoading(true)
        const pageType = getCurrentPageType()

        switch (pageType) {
          case "poi":
            const pois = await getAllPOIs()
            setAllData(pois)
            break
          case "category":
            const categories = await getCategoriesApi()
            setAllData(categories)
            break
          case "tour":
            const tours = await getAllToursApi()
            setAllData(tours)
            break
          case "account":
            const accounts = await getUsersApi()
            setAllData(accounts)
            break
          case "audio":
            // Fetch all audio content (use high limit to get all at once)
            const audioRes = await audioContentApi.getAllTranslations(1, 1000)
            const audioData = audioRes?.data?.data || []
            setAllData(audioData)
            break
          default:
            setAllData([])
        }
      } catch (error) {
        console.error("Error fetching data for search:", error)
        setAllData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [location.pathname, shouldDisplaySearch])

  // Search and filter data
  const handleSearch = (query) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      clearSearch()
      return
    }

    const pageType = getCurrentPageType()
    let results = []

    const searchTerm = query.toLowerCase()

    switch (pageType) {
      case "poi":
        results = allData.filter(
          (poi) =>
            poi.name?.toLowerCase().includes(searchTerm) ||
            poi.description?.toLowerCase().includes(searchTerm)
        )
        break
      case "category":
        results = allData.filter((cat) =>
          cat.name?.toLowerCase().includes(searchTerm)
        )
        break
      case "tour":
        results = allData.filter(
          (tour) =>
            tour.name?.toLowerCase().includes(searchTerm) ||
            tour.description?.toLowerCase().includes(searchTerm)
        )
        break
      case "account":
        results = allData.filter(
          (acc) =>
            acc.username?.toLowerCase().includes(searchTerm) ||
            acc.email?.toLowerCase().includes(searchTerm) || 
            acc.fullName?.toLowerCase().includes(searchTerm)
        )
        break
      case "audio":
        results = allData.filter(
          (item) =>
            item.poiName?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
        )
        break
      default:
        results = []
    }

    setSearchResults(results.slice(0, 8)) // Limit to 8 results
    setShowResults(true)
    updateSearch(query, pageType)
  }

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch(searchQuery)
      setShowResults(false)
    }
  }

  // Handle result click
  const handleResultClick = (item) => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
    
    const pageType = getCurrentPageType()
    updateSearch(getItemDisplayName(item), pageType)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Get display name based on item type
  const getItemDisplayName = (item) => {
    const pageType = getCurrentPageType()
    switch (pageType) {
      case "poi":
        return item.name
      case "category":
        return item.name
      case "tour":
        return item.name
      case "account":
        return item.username || item.email
      case "audio":
        return item.poiName || "Audio"
      default:
        return ""
    }
  }

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b bg-white">

      {/* Search */}
      {shouldDisplaySearch && (
        <div className="relative w-1/3" ref={searchRef}>
          <Search className="text-gray-400 w-5 h-5 absolute ml-3 mt-2 pointer-events-none" />
          <input
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery && setShowResults(true)}
            className="w-full px-12 py-2 rounded-full bg-gray-100 outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
                setShowResults(false)
              }}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-gray-500 text-sm">Đang tải...</div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(item)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 transition"
                    >
                      <p className="font-medium text-gray-900">
                        {getItemDisplayName(item)}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">Không tìm thấy kết quả</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-4 ml-auto">

        {/* ROLE SWITCH */}
      
        {/*  Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-pink-500 hover:text-white transition duration-200"
        >
          Logout
        </button>

        {/*  User Info */}
        <div className="text-right">
          <p className="font-semibold">{user.username}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>

      </div>

    </div>
  )
}