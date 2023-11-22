import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ALL_GENRES } from '../queries'
import { useState } from 'react'

const Books = (props) => {
  let genres = ['all']
  const [genre, setGenre] = useState(genres[0])
  const resultGenres = useQuery(ALL_GENRES)
  const resultBooks = useQuery(ALL_BOOKS, { variables: genre === genres[0] ? {} : { genre } })

  if (resultBooks.loading || resultGenres.loading) {
    return null
  }

  // collect all books
  const books = resultBooks.data.allBooks
  console.log('rendering Books...', books.length)

  // collect unique genres from all books
  resultGenres.data.allGenres.map(genre => genres.push(genre))

  return (
    <div>
      <h2>books</h2>
      {genres.map((genre, i) =>
        <button key={i} onClick={() => setGenre(genre)}>
          {genre}
        </button>
      )}
      <table>
        <caption>showing <b>{genre}</b> books</caption>
        <tbody>
          <tr>
            <th>title</th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Books