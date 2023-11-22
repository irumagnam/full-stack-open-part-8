const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const bookCount = async () => {
  return Book.collection.countDocuments()
}

const bookCountForAuthor = async ({ id }) => {
  const books = await Book.find({ author: id })
  return books.length
}

const authorCount = async () => {
  return Author.collection.countDocuments()
}

const allBooks = async (root, args) => {
  const queryFilter = {}
  // apply 'author' filter
  if (args.author) {
    const author = await Author.findOne({ name: args.author })
    queryFilter.author = author.id
  }
  // apply 'genre' filter
  if (args.genre) {
    queryFilter.genres = args.genre
  }
  return await Book.find(queryFilter).populate('author')
}

const allAuthors = async (root, args) => {
  return await Author.aggregate([
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: 'author',
        as: 'books'
      }
    },
    {
      $project: {
        id: { $toString: '$_id' },
        name: true,
        born: true,
        bookCount: { $size: '$books' }
      }
    }
  ])
}

const allGenres = async () => {
  const books = await Book.find({})
  const genres = []
  // collect unique genres from all books
  books.forEach(book => {
    book.genres.forEach(genre => {
      if (genres.includes(genre) === false) {
        genres.push(genre)
      }
    })
  })
  return genres
}

const me = (root, args, { currentUser }) => {
  return currentUser
}

const addBook = async (root, args, { currentUser }) => {
  // make sure user is logged in
  if (!currentUser) {
    throw new GraphQLError('wrong credentials', {
      extensions: { code: 'BAD_USER_INPUT' }
    })
  }

  // check to see if author exists
  let author = await Author.findOne({ name: args.author })
  if (!author) { // new author
    // add this author to repository
    console.log(`adding ${args.author} to repository`)
    author = await createAuthor({ name: args.author })
  }

  // create book
  const book = await createBook({ ...args, author: author._id })

  // publish the message
  pubsub.publish('BOOK_ADDED', { bookAdded: book }) 

  return book
}

const createBook = async(args) => {
  const book = new Book({ ...args })
  try {
    await book.save()
  } catch(error) {
    const message = `Saving book failed: ${error.message}`
    throw new GraphQLError(message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args.title,
        error
      }
    })
  }
  return book.populate('author')
}

const addAuthor = async (root, args) => {
  return await createAuthor(args)
}

const createAuthor = async (args) => {
  const author = new Author({ ...args })
  try {
    await author.save()
  } catch(error) {
    const message = `Saving author failed: ${error.message}`
    throw new GraphQLError(message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args.name,
        error
      }
    })
  }
  return author
}

const editAuthor = async (root, args, { currentUser }) => {
  // make sure user is logged in
  if (!currentUser) {
    throw new GraphQLError('wrong credentials', {
      extensions: { code: 'BAD_USER_INPUT' }
    })
  }
  const author = await Author.findOne({ name: args.name })
  if (author) {
    author.born = args.born
    try {
      await author.save()
    } catch (error) {
      throw new GraphQLError('Editing author failed', {
        extensions: {
          code: 'BAD_USER_INPUT',
          invalidArgs: args.born,
          error
        }
      })
    }
    return author
  }
  return null
}

const createUser = async (root, { username, favoriteGenre }) => {
  const user = new User({ username, favoriteGenre })

  return user.save()
    .catch(error => {
      throw new GraphQLError('Creating the user failed', {
        extensions: {
          code: 'BAD_USER_INPUT',
          invalidArgs: args.name,
          error
        }
      })
    })
}

const login = async (root, args) => {
  const user = await User.findOne({ username: args.username })

  if ( !user || args.password !== 'secret' ) {
    throw new GraphQLError('wrong credentials', {
      extensions: { code: 'BAD_USER_INPUT' }
    })        
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }

  return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
}

const bookAdded = {
  subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
}

const resolvers = {
  Query: {
    bookCount,
    authorCount,
    allBooks,
    allAuthors,
    allGenres,
    me
  },
  Mutation: {
    addBook,
    addAuthor,
    editAuthor,
    createUser,
    login,
  },
  Subscription: {
    bookAdded
  }
}


module.exports = resolvers