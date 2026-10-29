
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

INSERT INTO book (title, author, price, pages) VALUES
('The Alchemist', 'Paulo Coelho', 250, 208),
('Wings of Fire', 'A.P.J. Abdul Kalam', 300, 180),
('Atomic Habits', 'James Clear', 450, 320),
('Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 336),
('Ikigai', 'Hector Garcia', 280, 194),
('The Psychology of Money', 'Morgan Housel', 400, 256),
('Deep Work', 'Cal Newport', 320, 296),
('Think and Grow Rich', 'Napoleon Hill', 270, 238),
('The Power of Habit', 'Charles Duhigg', 380, 371),
('Zero to One', 'Peter Thiel', 330, 210);
