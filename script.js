document.addEventListener("DOMContentLoaded", () => {
  const bookList = document.getElementById("book-list");

  // Kitapların listesini oluştur
  const books = [
    { title: "Kitap 3", folder: "Dusunme-Becerileri-ve-Kodlama", cover: "assets/books/Dusunme-Becerileri-ve-Kodlama/Dusunme-Becerileri-ve-Kodlama_Page_01.png", pageCount: 32},
    { title: "Kitap 1", folder: "diger-kitap", cover: "assets/books/diger-kitap/diger-kitap_Page_01.png", pageCount: 1 },
    { title: "Kitap 2", folder: "Hakan", cover: "assets/books/Hakan/Hakan_Page_01.png", pageCount: 1 },
    { title: "Kitap 3", folder: "Ilker", cover: "assets/books/Ilker/Ilker_Page_01.png", pageCount: 2 },
    { title: "Kitap 3", folder: "Dusunme-Becerileri-ve-Kodlama", cover: "assets/books/Dusunme-Becerileri-ve-Kodlama/Dusunme-Becerileri-ve-Kodlama_Page_01.png" , pageCount: 32},
    // Diğer kitaplar...
    { title: "Kitap 3", folder: "Dusunme-Becerileri-ve-Kodlama", cover: "assets/books/Dusunme-Becerileri-ve-Kodlama/Dusunme-Becerileri-ve-Kodlama_Page_01.png" , pageCount: 32},
    { title: "Kitap 1", folder: "diger-kitap", cover: "assets/books/diger-kitap/diger-kitap_Page_01.png", pageCount: 1 },
    { title: "Kitap 2", folder: "Hakan", cover: "assets/books/Hakan/Hakan_Page_01.png", pageCount: 1 },
    { title: "Kitap 3", folder: "Ilker", cover: "assets/books/Ilker/Ilker_Page_01.png", pageCount: 2 },
    { title: "Kitap 3", folder: "Dusunme-Becerileri-ve-Kodlama", cover: "assets/books/Dusunme-Becerileri-ve-Kodlama/Dusunme-Becerileri-ve-Kodlama_Page_01.png", pageCount: 32 },
    // Diğer kitaplar...
  ];

  // Kitap kapaklarını ekrana yerleştir
  books.forEach(book => {
      const bookItem = document.createElement("div");
      bookItem.classList.add("book-item");

      const bookCover = document.createElement("img");
      bookCover.src = book.cover;
      bookCover.alt = book.title;
      bookCover.classList.add("book-cover");

      const bookTitle = document.createElement("div");
      bookTitle.classList.add("book-title");
      bookTitle.textContent = book.title;

      bookCover.addEventListener("click", () => {
          // Kitaba tıklayınca app.html sayfasına yönlendir ve kitabı yükle
          window.location.href = `app.html?book=${book.folder}`;  // Dinamik olarak kitap klasörünü belirt
          localStorage.setItem('selectedBookTotalPages', book.pageCount); // Toplam sayfa sayısını kaydet
      });

      bookItem.appendChild(bookCover);
      bookItem.appendChild(bookTitle);
      bookList.appendChild(bookItem);
  });
});