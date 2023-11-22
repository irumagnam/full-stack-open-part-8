import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { ADD_BOOK, ALL_BOOKS, ALL_AUTHORS, ALL_GENRES } from '../queries'
import { updateCache } from '../App'

const NewBook = ({ notify }) => {
  console.log('rendering NewBook...')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])
  const [ createPerson ] = useMutation(ADD_BOOK, {
    /*refetchQueries: [ { query: ALL_BOOKS }, { query: ALL_AUTHORS }, { query: ALL_GENRES } ],
    onCompleted: (data) => {
      console.log(data)
      notify({ type: 'info', text: 'new book added successfuly' })
    },*/
    update: (cache, response) => {
      updateCache(cache, { query: ALL_BOOKS }, response.data.addBook)
    },
    onError: (error) => {
      console.log(error)
      const messages = error.graphQLErrors.map(e => e.message).join('\n')
      notify({ type: 'error', text: messages })
    }
  })

  const submit = async (event) => {
    event.preventDefault()
    console.log('adding book...')
    createPerson({ variables: { title, author, published: parseInt(published), genres } })
    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    if (genre.trim().length > 0) {
      setGenres(genres.concat(genre.trim()))
      setGenre('')
    }
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <div><button type="submit">create book</button></div>
      </form>
    </div>
  )
}

export default NewBook