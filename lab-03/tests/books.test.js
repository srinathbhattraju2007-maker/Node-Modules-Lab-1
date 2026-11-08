// tests/books.test.js - run with: npm test
// Uses an in-memory database, so your real data is never touched.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { openDb } = require("../db");
const { seedBooks } = require("../seed");
const { createApp } = require("../app");

let db;
let app;

before(async () => {
  db = await openDb(":memory:");
  await seedBooks(db);
  app = createApp(db);
});

after(async () => {
  await db.close();
});

describe("GET /books (success)", () => {
  test("returns 200 with defaults applied", async () => {
    const res = await request(app).get("/books");
    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Books fetched successfully");
    assert.equal(res.body.data.length, 10);
    assert.equal(res.body.pagination.limit, 10);
    assert.equal(res.body.pagination.offset, 0);
    assert.equal(res.body.pagination.total, 25);
    assert.equal(res.body.data[0].id, 1); // default order_by=id ASC
  });

  test("trailing slash /books/ also works", async () => {
    const res = await request(app).get("/books/");
    assert.equal(res.status, 200);
  });

  test("search_q does a partial, case-insensitive title match", async () => {
    const res = await request(app).get("/books?search_q=sql");
    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.total, 2);
    for (const b of res.body.data) assert.match(b.title.toLowerCase(), /sql/);
  });

  test("search_q with no match returns 200 and an empty list", async () => {
    const res = await request(app).get("/books?search_q=zzzzzz");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, []);
    assert.equal(res.body.pagination.total, 0);
  });

  test("a literal % in search_q is not treated as a wildcard", async () => {
    const res = await request(app).get("/books?search_q=%25");
    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.total, 0);
  });

  test("a SQL injection attempt in search_q is just text", async () => {
    const res = await request(app).get("/books").query({ search_q: "' OR 1=1 --" });
    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.total, 0);
  });

  test("order_by=price&order=DESC sorts by price descending", async () => {
    const res = await request(app).get("/books?order_by=price&order=DESC&limit=5");
    assert.equal(res.status, 200);
    const prices = res.body.data.map((b) => b.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => b - a));
    assert.equal(prices[0], 2500);
  });

  test("order_by=title&order=asc (lower case) sorts A-Z", async () => {
    const res = await request(app).get("/books?order_by=title&order=asc&limit=100");
    const titles = res.body.data.map((b) => b.title);
    const lower = (t) => t.toLowerCase();
    assert.deepEqual(titles, [...titles].sort((a, b) => (lower(a) < lower(b) ? -1 : lower(a) > lower(b) ? 1 : 0)));
  });

  test("limit and offset paginate without overlap", async () => {
    const page1 = await request(app).get("/books?limit=5&offset=0");
    const page2 = await request(app).get("/books?limit=5&offset=5");
    assert.equal(page1.body.data.length, 5);
    assert.equal(page2.body.data.length, 5);
    assert.equal(page2.body.data[0].id, page1.body.data[4].id + 1);
    assert.equal(page2.body.pagination.offset, 5);
  });

  test("offset beyond the data returns an empty page, not an error", async () => {
    const res = await request(app).get("/books?offset=1000");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 0);
  });

  test("min_price and max_price use BETWEEN", async () => {
    const res = await request(app).get("/books?min_price=500&max_price=700&limit=100");
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);
    for (const b of res.body.data) assert.ok(b.price >= 500 && b.price <= 700);
  });

  test("min_price alone and max_price alone work", async () => {
    const min = await request(app).get("/books?min_price=1500&limit=100");
    for (const b of min.body.data) assert.ok(b.price >= 1500);
    const max = await request(app).get("/books?max_price=450&limit=100");
    for (const b of max.body.data) assert.ok(b.price <= 450);
    assert.ok(min.body.data.length > 0 && max.body.data.length > 0);
  });

  test("filters can be combined", async () => {
    const res = await request(app).get(
      "/books?search_q=sql&max_price=650&order_by=price&order=ASC"
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.total, 1);
    assert.equal(res.body.data[0].title, "SQL Performance Explained");
  });
});

describe("GET /books (bad query -> 400)", () => {
  const cases = [
    ["order_by not in whitelist", "/books?order_by=password", /order_by must be one of/],
    ["SQL in order_by", "/books?order_by=id;DROP%20TABLE%20books", /order_by must be one of/],
    ["order not ASC/DESC", "/books?order=sideways", /order must be ASC or DESC/],
    ["limit not a number", "/books?limit=abc", /limit must be an integer/],
    ["limit zero", "/books?limit=0", /limit must be an integer/],
    ["limit too large", "/books?limit=101", /limit must be an integer/],
    ["negative offset", "/books?offset=-1", /offset must be an integer/],
    ["min_price not numeric", "/books?min_price=cheap", /min_price must be a number/],
    ["max_price negative", "/books?max_price=-5", /max_price must be a number/],
    ["min greater than max", "/books?min_price=900&max_price=100", /min_price must not be greater/],
    ["repeated parameter", "/books?limit=1&limit=2", /given only once/],
  ];
  for (const [name, url, pattern] of cases) {
    test(name, async () => {
      const res = await request(app).get(url);
      assert.equal(res.status, 400);
      assert.match(res.body.message, pattern);
      assert.deepEqual(Object.keys(res.body), ["message"]);
    });
  }
});

describe("GET /books/:id", () => {
  test("200 for an existing book", async () => {
    const res = await request(app).get("/books/1");
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, 1);
    assert.equal(res.body.data.title, "Clean Code");
  });
  test("404 when the id does not exist", async () => {
    const res = await request(app).get("/books/99999");
    assert.equal(res.status, 404);
    assert.equal(res.body.message, "Book with id 99999 not found");
  });
  test("400 when the id is not a positive integer", async () => {
    for (const bad of ["abc", "0", "-3", "1.5", "1e3"]) {
      const res = await request(app).get(`/books/${bad}`);
      assert.equal(res.status, 400, `id "${bad}" should be 400`);
      assert.equal(res.body.message, "id must be a positive integer");
    }
  });
});

describe("POST /books", () => {
  test("201 with the created book and a Location header", async () => {
    const res = await request(app)
      .post("/books")
      .send({ title: "  Test Book  ", author: "Test Author", price: 123.5 });
    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Book created successfully");
    assert.equal(res.body.data.title, "Test Book"); // trimmed
    assert.equal(res.body.data.price, 123.5);
    assert.equal(res.headers.location, `/books/${res.body.data.id}`);
    const check = await request(app).get(`/books/${res.body.data.id}`);
    assert.equal(check.status, 200);
  });

  test("a numeric string price such as \"499\" is accepted", async () => {
    const res = await request(app).post("/books").send({ title: "T", author: "A", price: "499" });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.price, 499);
  });

  test("price 0 is allowed", async () => {
    const res = await request(app).post("/books").send({ title: "Free", author: "A", price: 0 });
    assert.equal(res.status, 201);
  });

  const bad = [
    ["missing title", { author: "A", price: 10 }, /title is required/],
    ["missing author", { title: "T", price: 10 }, /author is required/],
    ["missing price", { title: "T", author: "A" }, /price is required/],
    ["empty title", { title: "   ", author: "A", price: 10 }, /title must be a non-empty string/],
    ["title is a number", { title: 5, author: "A", price: 10 }, /title must be a non-empty string/],
    ["non-numeric price", { title: "T", author: "A", price: "abc" }, /price must be a number/],
    ["price is boolean", { title: "T", author: "A", price: true }, /price must be a number/],
    ["price is empty string", { title: "T", author: "A", price: "" }, /price must be a number/],
    ["price is NaN-like text", { title: "T", author: "A", price: "1e5" }, /price must be a number/],
    ["negative price", { title: "T", author: "A", price: -1 }, /price must not be negative/],
    ["title too long", { title: "x".repeat(201), author: "A", price: 1 }, /at most 200/],
  ];
  for (const [name, body, pattern] of bad) {
    test(`400: ${name}`, async () => {
      const res = await request(app).post("/books").send(body);
      assert.equal(res.status, 400);
      assert.match(res.body.message, pattern);
      assert.deepEqual(Object.keys(res.body), ["message"]);
    });
  }

  test("400 lists every problem at once", async () => {
    const res = await request(app).post("/books").send({});
    assert.equal(res.status, 400);
    assert.match(res.body.message, /title is required/);
    assert.match(res.body.message, /author is required/);
    assert.match(res.body.message, /price is required/);
  });

  test("400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/books")
      .set("Content-Type", "application/json")
      .send('{"title": "x", ');
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Invalid JSON in request body");
  });

  test("400 when there is no JSON body", async () => {
    const res = await request(app).post("/books");
    assert.equal(res.status, 400);
    assert.match(res.body.message, /JSON object/);
  });

  test("400 when the body is an array", async () => {
    const res = await request(app).post("/books").send([{ title: "T" }]);
    assert.equal(res.status, 400);
  });

  test("nothing is saved when validation fails", async () => {
    const before = (await request(app).get("/books")).body.pagination.total;
    await request(app).post("/books").send({ title: "Ghost", author: "A", price: "abc" });
    const after = (await request(app).get("/books")).body.pagination.total;
    assert.equal(after, before);
  });

  test("a stored title containing SQL is saved as plain text", async () => {
    const evil = "Robert'); DROP TABLE books;--";
    const res = await request(app).post("/books").send({ title: evil, author: "A", price: 1 });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.title, evil);
    assert.equal((await request(app).get("/books/1")).status, 200); // table still exists
  });
});

describe("PUT /books/:id", () => {
  test("200 and the changes are stored", async () => {
    const res = await request(app)
      .put("/books/2")
      .send({ title: "The Pragmatic Programmer (2nd Ed)", author: "Andrew Hunt", price: 950 });
    assert.equal(res.status, 200);
    assert.equal(res.body.message, "Book updated successfully");
    const check = await request(app).get("/books/2");
    assert.equal(check.body.data.title, "The Pragmatic Programmer (2nd Ed)");
    assert.equal(check.body.data.price, 950);
  });
  test("404 when the id does not exist", async () => {
    const res = await request(app).put("/books/99999").send({ title: "T", author: "A", price: 1 });
    assert.equal(res.status, 404);
    assert.equal(res.body.message, "Book with id 99999 not found");
  });
  test("400 for invalid body", async () => {
    const res = await request(app).put("/books/2").send({ title: "T", author: "A", price: "free" });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /price must be a number/);
  });
  test("400 for invalid id (checked before the record lookup)", async () => {
    const res = await request(app).put("/books/abc").send({ title: "T", author: "A", price: 1 });
    assert.equal(res.status, 400);
  });
});

describe("DELETE /books/:id", () => {
  test("200, then the book is gone (404)", async () => {
    const created = await request(app).post("/books").send({ title: "Temp", author: "A", price: 1 });
    const id = created.body.data.id;
    const del = await request(app).delete(`/books/${id}`);
    assert.equal(del.status, 200);
    assert.equal(del.body.message, "Book deleted successfully");
    assert.equal(del.body.data.id, id);
    assert.equal((await request(app).get(`/books/${id}`)).status, 404);
    assert.equal((await request(app).delete(`/books/${id}`)).status, 404); // second delete
  });
  test("400 for invalid id", async () => {
    const res = await request(app).delete("/books/abc");
    assert.equal(res.status, 400);
  });
});

describe("other routes", () => {
  test("GET / and /health return 200", async () => {
    assert.equal((await request(app).get("/")).status, 200);
    assert.equal((await request(app).get("/health")).status, 200);
  });
  test("unknown route returns JSON 404", async () => {
    const res = await request(app).get("/authors");
    assert.equal(res.status, 404);
    assert.equal(res.body.message, "Route GET /authors not found");
  });
  test("unsupported method on /books returns JSON 404", async () => {
    const res = await request(app).patch("/books/1");
    assert.equal(res.status, 404);
    assert.ok(res.body.message);
  });
});
