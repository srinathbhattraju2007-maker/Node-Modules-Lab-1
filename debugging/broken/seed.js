// seed.js - inserts sample books so search, sort, filters and pagination
// can be demonstrated. Run with:  npm run seed
require("dotenv").config({ quiet: true });
const { openDb } = require("./db");

const SAMPLE_BOOKS = [
  ["Clean Code", "Robert C. Martin", 799],
  ["The Pragmatic Programmer", "Andrew Hunt", 899],
  ["Eloquent JavaScript", "Marijn Haverbeke", 650],
  ["You Don't Know JS", "Kyle Simpson", 550],
  ["Node.js Design Patterns", "Mario Casciaro", 1250],
  ["Learning SQL", "Alan Beaulieu", 700],
  ["SQL Performance Explained", "Markus Winand", 600],
  ["Designing Data-Intensive Applications", "Martin Kleppmann", 1499],
  ["RESTful Web APIs", "Leonard Richardson", 950],
  ["Building Microservices", "Sam Newman", 1100],
  ["JavaScript: The Good Parts", "Douglas Crockford", 450],
  ["Refactoring", "Martin Fowler", 1050],
  ["Introduction to Algorithms", "Thomas H. Cormen", 1800],
  ["Grokking Algorithms", "Aditya Bhargava", 520],
  ["The Mythical Man-Month", "Frederick P. Brooks", 480],
  ["Web Development with Node and Express", "Ethan Brown", 780],
  ["HTTP: The Definitive Guide", "David Gourley", 890],
  ["Database System Concepts", "Abraham Silberschatz", 1350],
  ["Python Crash Course", "Eric Matthes", 599],
  ["Head First Design Patterns", "Eric Freeman", 999],
  ["Code Complete", "Steve McConnell", 1200],
  ["Working Effectively with Legacy Code", "Michael Feathers", 870],
  ["Test Driven Development", "Kent Beck", 610],
  ["Programming Pearls", "Jon Bentley", 400],
  ["The Art of Computer Programming", "Donald Knuth", 2500],
];

/** Inserts the sample books only when the table is empty. Returns how many were added. */
async function seedBooks(db) {
  const { count } = await db.get("SELECT COUNT(*) AS count FROM books");
  if (count > 0) return 0;

  await db.exec("BEGIN");
  try {
    for (const [title, author, price] of SAMPLE_BOOKS) {
      await db.run("INSERT INTO books (title, author, price) VALUES (?, ?, ?)", [
        title,
        author,
        price,
      ]);
    }
    await db.exec("COMMIT");
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
  return SAMPLE_BOOKS.length;
}

module.exports = { seedBooks, SAMPLE_BOOKS };

if (require.main === module) {
  (async () => {
    const db = await openDb();
    const added = await seedBooks(db);
    console.log(added ? `Seeded ${added} books.` : "Table already has data - nothing to seed.");
    await db.close();
  })().catch((err) => {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  });
}
