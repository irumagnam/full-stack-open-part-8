import { useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import { UPDATE_AUTHOR, ALL_AUTHORS } from '../queries'

const UpdateAuthor = ({ notify }) => {
  const result = useQuery(ALL_AUTHORS)
  const [author, setAuthor] = useState('')
  const [born, setBorn] = useState('')
  const [ updateAuthor ] = useMutation(UPDATE_AUTHOR, {
    //refetchQueries: [ { query: ALL_AUTHORS } ],
    update: (cache, response) => {
      cache.updateQuery({ query: ALL_AUTHORS }, ({ allAuthors }) => {
        return {
          allAuthors: allAuthors.map(author =>
            author.name === response.data.name ? response.data : author
          ),
        }
      })
    },
    onCompleted: (data) => {
      console.log(data)
      notify({ type: 'info', text: 'updated successfuly' })
    },
    onError: (error) => {
      console.log(error)
      const messages = error.graphQLErrors.map(e => e.message).join('\n')
      notify({ type: 'error', text: messages })
    }
  })

  if (result.loading) {
    return null
  }

  const authors = result.data.allAuthors
  const changeAuthor = ({ target }) => {
    setAuthor(target.value)
    const author = authors.find(a =>
      a.name === target.value
    )
    setBorn(author.born || '')
  }
  const changeBorn = ({ target }) => setBorn(target.value)
  const submit = async (event) => {
    event.preventDefault()
    updateAuthor({ variables: { author, born: parseInt(born) } })
    setAuthor('')
    setBorn('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          author
          <select value={author} onChange={changeAuthor}>
            <option key={0}>-------Select-------</option>
            {authors.map(a =>
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            )}
          </select>
        </div>
        <div>
          born
          <input
            type="number"
            value={born}
            onChange={changeBorn}
          />
        </div>
        <div>
          <button type="submit">
            update author
          </button>
        </div>
      </form>
    </div>
  )
}

export default UpdateAuthor