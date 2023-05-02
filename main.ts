import type { MySqlDriver } from '@mikro-orm/mysql'
import {
  Cascade,
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Unique
} from '@mikro-orm/core' // or any other driver package

@Entity()
class Author {
  @PrimaryKey()
  id!: number

  @OneToMany(() => Book, book => book.author, { cascade: [Cascade.ALL], orphanRemoval: true })
  books = new Collection<Book>(this)
}

@Unique({ properties: ['type', 'title'] })
@Entity()
class Book {
  @PrimaryKey()
  id!: number

  @ManyToOne(() => Author)
  author!: Author

  @Property()
  type!: string

  @Property()
  title!: string

  @Property()
  color!: string
}

async function init() {
  const orm = await MikroORM.init<MySqlDriver>({
    dbName: 'test-4019',
    type: 'mysql',
    entities: [Author, Book],
    debug: true
  })
  await orm.schema.refreshDatabase()

  const em = orm.em.fork()
  const author = new Author()
  const book1 = new Book()
  book1.title = 'book1'
  book1.type = 't1'
  book1.color = 'c1'
  author.books.add(book1)
  await em.persistAndFlush(author)

  return orm
}

async function main() {
  const orm = await init()

  console.log('begin test ---------')
  const em = orm.em.fork()
  const author = await em.findOne(Author, { id: 1 }, {
    populate: ['books']
  })

  const newBook = new Book()
  newBook.title = 'book1'
  newBook.type = 't1'
  newBook.color = 'c2'
  author!.books.set([newBook])
  await em.flush()

  await orm.close()
}

main().catch(console.error)
