import { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import { Routes, Route, Link, useMatch, useNavigate } from 'react-router-dom'
import './App.css'
import UpdateAuthor from './components/UpdateAuthor'
import Welcome from './components/Welcome'
import Notify from './components/Notify'
import LoginForm from './components/LoginForm'
import { useApolloClient, useQuery, useSubscription } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS, ALL_GENRES, BOOK_ADDED, CURRENT_USER } from './queries'
import Recommendations from './components/Recommendations'

export const updateCache = (cache, book) => {
  // update allBooks
  cache.updateQuery({ query: ALL_BOOKS }, (data) => {
    if (!data) return data
    const { allBooks } = data
    const existingBook = allBooks.find(b => b.title === book.title)
    return {
      allBooks: existingBook ? allBooks : allBooks.concat(book),
    }
  })

  // update allAuthors
  cache.updateQuery({ query: ALL_AUTHORS }, (data) => {
    if (!data) return data
    const { allAuthors } = data
    const existingAuthor = allAuthors.find(a => a.name === book.author.name)
    return {
      allAuthors: existingAuthor ? allAuthors : allAuthors.concat(book.author),
    }
  })

  // update allGenres
  cache.updateQuery({ query: ALL_GENRES }, (data) => {
    if (!data) return data
    const { allGenres } = data
    const revisedGenres = [ ...allGenres ]
    book.genres.forEach(g => {
      if (revisedGenres.includes(g) === false) {
        revisedGenres.push(g)
      }
    })
    return {
      allGenres: revisedGenres,
    }
  })
}

const App = () => {
  const [token, setToken] = useState(null)
  const [notifyMessage, setNotifyMessage] = useState(null)
  const client = useApolloClient()
  const result = useQuery(CURRENT_USER)

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      console.log('new book arrived', result)
      const book = data.data.bookAdded
      notify({ type: 'info', text: `${book.title} added` })
      updateCache(client.cache, book)
    }
  })

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  const notify = (message) => {
    setNotifyMessage(message)
    setTimeout(() => {
      setNotifyMessage(null)
    }, 10000)
  }

  const setUpLink = (label, path, element) => (
    navLinks.push({ label, path, element })
  )

  const navLinks = []
  setUpLink('home', '/', <Welcome />)
  setUpLink('books', '/books', <Books />)
  setUpLink('authors', '/authors', <Authors />)
  if (token) {
    setUpLink('add book', '/addbook', <NewBook notify={notify} />)
    setUpLink('update author', '/updateauthor', <UpdateAuthor notify={notify} />)
    setUpLink('recommend', '/recommend', <Recommendations genre={result.data.me.favoriteGenre} />)
  } else {
    setUpLink('login', '/login', <LoginForm setToken={setToken} notify={notify} />)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', margin: '10px auto' }}>
        {navLinks.map(({ label, path }) =>
          <Link key={label} to={path}>
            {label}
          </Link>
        )}
        {token && <button onClick={logout}>logout</button>}
      </div>
      <Notify message={notifyMessage} />
      <Routes>
        {navLinks.map(({ label, path, element }) =>
          <Route key={label} path={path} element={element} />
        )}
      </Routes>
    </div>
  )
}

export default App