document.addEventListener("DOMContentLoaded", () => {
  const bookList = document.getElementById("book-list");

  if (!bookList) {
    console.error("book-list elementi bulunamadı");
    return;
  }

  console.log("Yüklenen kitaplar:", booksData);

  // KITAP KAPAK RESIMLERI
  booksData.forEach((book) => {
    const bookItem = document.createElement("div");
    bookItem.classList.add("book-item");

    const bookCover = document.createElement("img");
    bookCover.src = book.cover;
    bookCover.alt = book.title;
    bookCover.classList.add("book-cover");

    bookCover.onerror = () => {
      console.error(`Resim yüklenemedi: ${book.cover}`);
    };

    const bookTitle = document.createElement("div");
    bookTitle.classList.add("book-title");
    bookTitle.textContent = book.title;

    bookCover.addEventListener("click", () => {
      console.log(`Kitaba tıklandı: ${book.title}`);
      // Kitaba tıklayınca app.html sayfasına yönlendir ve kitabı yükle
      window.location.href = `app.html?book=${encodeURIComponent(book.folder)}`;
      localStorage.setItem("selectedBookTotalPages", book.pageCount);
    });

    bookItem.appendChild(bookCover);
    bookItem.appendChild(bookTitle);
    bookList.appendChild(bookItem);
  });
});

console.log("script.js yüklendi");
