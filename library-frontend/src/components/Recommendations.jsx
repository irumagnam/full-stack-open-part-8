import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'
import { useState } from 'react'

const Recommendations = ({ genre }) => {
  const result = useQuery(ALL_BOOKS, { variables: { genre } })

  if (result.loading) {
    return null
  }

  const books = result.data.allBooks

  return (
    <div>
      <h2>recommendations</h2>
      <label>books in your favorite genre <b>{genre}</b></label>
      <table>
        <tbody>
          <tr>
            <th></th>
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

export default Recommendations