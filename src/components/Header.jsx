import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { searchContent } from '../utils/search.js'

const suggestions = ['Redis', 'database locks', 'kubectl', 'docker logs']

export function Header({ dark, setDark }) {
  const [menu, setMenu] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const searchTrigger = useRef(null)
  const searchInput = useRef(null)
  const searchDialog = useRef(null)
  const results = useMemo(() => searchContent(query), [query])

  useEffect(() => {
    setMenu(false)
    setSearchOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [location.pathname])

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [searchOpen])

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function closeSearch(restoreFocus = true) {
    setSearchOpen(false)
    setQuery('')
    setSelectedIndex(0)
    if (restoreFocus) requestAnimationFrame(() => searchTrigger.current?.focus())
  }

  function openResult(result) {
    navigate(result.href)
    closeSearch(false)
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSearch()
      return
    }

    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      const nextIndex = (selectedIndex + 1) % results.length
      setSelectedIndex(nextIndex)
      document.getElementById(`search-result-${nextIndex}`)?.scrollIntoView({ block: 'nearest' })
      return
    }

    if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      const nextIndex = (selectedIndex - 1 + results.length) % results.length
      setSelectedIndex(nextIndex)
      document.getElementById(`search-result-${nextIndex}`)?.scrollIntoView({ block: 'nearest' })
      return
    }

    if (event.key === 'Enter' && results.length) {
      event.preventDefault()
      openResult(results[selectedIndex])
      return
    }

    if (event.key === 'Tab') {
      const focusable = searchDialog.current?.querySelectorAll(
        'input:not([disabled]), button:not([disabled]), a[href]',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Kha Trần home">
        <span className="brand-wordmark" aria-hidden="true">
          KHA<span className="brand-dot">.</span>TRAN
        </span>
        <img className="brand-mark" src="/assets/favicon.svg" alt="" />
      </Link>
      <nav className={menu ? 'nav open' : 'nav'}>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/articles">Articles</NavLink>
        <NavLink to="/archive">Archive</NavLink>
        <NavLink to="/cheatsheets">Cheatsheets</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <div className="header-actions">
        <button
          ref={searchTrigger}
          className="icon-button"
          aria-label="Search the site"
          aria-expanded={searchOpen}
          aria-haspopup="dialog"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={18} />
        </button>
        <button
          className="theme-button"
          aria-label="Toggle color theme"
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          <span>{dark ? 'Light' : 'Dark'}</span>
        </button>
        <a className="contact-button" href="mailto:hello@kha.trn">
          Get in touch <ArrowUpRight size={15} />
        </a>
        <button
          className="mobile-menu"
          onClick={() => setMenu(!menu)}
          aria-label="Toggle navigation"
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>

      {searchOpen && (
        <div
          className="search-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSearch()
          }}
        >
          <section
            ref={searchDialog}
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search articles and commands"
            onKeyDown={handleDialogKeyDown}
          >
            <div className="search-field">
              <Search aria-hidden="true" size={19} />
              <input
                ref={searchInput}
                type="search"
                role="combobox"
                aria-label="Search articles and commands"
                aria-autocomplete="list"
                aria-expanded={Boolean(query.trim() && results.length)}
                aria-controls="site-search-results"
                aria-activedescendant={
                  query.trim() && results.length ? `search-result-${selectedIndex}` : undefined
                }
                placeholder="Search articles, tools, commands…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelectedIndex(0)
                }}
              />
              {query && (
                <button
                  className="search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('')
                    setSelectedIndex(0)
                    searchInput.current?.focus()
                  }}
                >
                  <X size={15} />
                </button>
              )}
              <button
                className="search-close"
                aria-label="Close search"
                onClick={() => closeSearch()}
              >
                <span>ESC</span>
                <X aria-hidden="true" size={14} />
              </button>
            </div>

            <div className="search-status">
              <span>
                {query.trim()
                  ? results.length
                    ? `${results.length} MATCH${results.length === 1 ? '' : 'ES'}`
                    : 'NO MATCHES'
                  : 'SEARCH THE FIELD NOTES'}
              </span>
              <span>↑↓ MOVE&nbsp;&nbsp; ↵ OPEN&nbsp;&nbsp; ESC CLOSE</span>
            </div>

            {query.trim() ? (
              results.length ? (
                <div className="search-results" id="site-search-results" role="listbox">
                  {results.map((result, index) => (
                    <Link
                      key={result.id}
                      id={`search-result-${index}`}
                      to={result.href}
                      role="option"
                      aria-selected={selectedIndex === index}
                      className={selectedIndex === index ? 'search-result active' : 'search-result'}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => closeSearch(false)}
                    >
                      <span className="search-result-topline">
                        <span className="search-result-kind">{result.kind}</span>
                        <span className="search-result-meta">{result.meta}</span>
                      </span>
                      <strong>{result.title}</strong>
                      <span className="search-result-preview">{result.preview}</span>
                      <ArrowUpRight className="search-result-arrow" size={15} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  <span className="search-empty-mark">?</span>
                  <div>
                    <strong>No matches for “{query.trim()}”</strong>
                    <p>Try a technology, a broader phrase, or part of a command.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="search-suggestions">
                <span className="search-suggestions-label">TRY A SEARCH</span>
                <div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion)
                        setSelectedIndex(0)
                        searchInput.current?.focus()
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p>Search article titles, topics, summaries, and command snippets.</p>
              </div>
            )}

            <footer className="search-footer">
              <span>
                CTRL / <kbd>⌘</kbd> <b>+</b> <kbd>K</kbd> TO SEARCH
              </span>
              <span>KHA TRẦN / FIELD NOTES</span>
            </footer>
          </section>
        </div>
      )}
    </header>
  )
}
