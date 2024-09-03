const drawingCanvas = document.createElement("canvas");
const canvas = document.getElementById("pdf-canvas");
const drawingCtx = drawingCanvas.getContext("2d");
const ctx = canvas.getContext("2d");
const fillColor = document.querySelector("#fill-color");
const sizeSlider = document.querySelector("#size-slider");
const colorBtns = document.querySelectorAll(".colors .option");
const colorPicker = document.querySelector("#color-picker");
const clearCanvas = document.querySelector(".clear-canvas");
const toolBtns = document.querySelectorAll(".tool");
const dropdownToolBtns = document.querySelectorAll(
  ".dropdown-menu .option.tool"
);
const toolsBoard = document.querySelector(".tools-board");
const scrollContainer = document.querySelector(".scroll-container");
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");
const totalPagesElement = document.getElementById("total-pages");
const currentPageElement = document.getElementById("current-page");
const toggleModeBtn = document.getElementById("toggle-mode");
const maxZoomLevel = 3; // Maksimum zoom seviyesi
const minZoomLevel = 0.5; // Minimum zoom seviyesi

let isPanning = false;
let startPanX, startPanY;
let panOffsetX = 0,
  panOffsetY = 0;
let arrowStartX, arrowStartY; // Ok başlangıç koordinatları
let isDraggingToolsBoard = false;
let offsetX, offsetY;
let undoStack = [];
let redoStack = [];
let zoomLevel = 1; // Başlangıç zoom seviyesi
let isDrawing = false;
let isDragging = false;
// let isPanMode = false; // Yeni değişken
let startX, startY, initialLeft, initialTop;
let pageNum = 1;
let totalPages = 32;
let baseImageName = ""; // Dinamik olarak yüklenecek
let prevMouseX,
  prevMouseY,
  snapshot,
  selectedTool = "brush",
  brushWidth = 5,
  selectedColor = "#000";

document.querySelector(".canvas-wrapper").appendChild(drawingCanvas);

window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookFolder = urlParams.get("book");

  if (bookFolder) {
    baseImageName = bookFolder; // Dinamik olarak kitap klasörünü belirle
    totalPages = parseInt(localStorage.getItem("selectedBookTotalPages"), 10); // Kaydedilen toplam sayfa sayısını al
    clearLocalStorageForPreviousBook();
    showImage(pageNum);
    updatePageNumber();
  } else {
    console.error("Kitap klasörü belirtilmedi!");
  }
});

document.querySelectorAll(".option").forEach((item) => {
  item.addEventListener("click", function () {
    item.classList.remove("active"); // Tıklama sonrası aktif durumu kaldır
    setTimeout(() => {
      item.classList.remove("hover"); // Tıklamadan bir süre sonra hover sınıfını da kaldır
    }, 300); // 300ms sonra hover sınıfını kaldırır
  });
});

function setCanvasDimensions() {
  const canvasWrapper = document.querySelector(".canvas-wrapper");
  drawingCanvas.width = canvas.width;
  drawingCanvas.height = canvas.height;
  // drawingCanvas.style.position = "relative";
  // drawingCanvas.style.left = "0";  // Aynı konumlandırma
  // drawingCanvas.style.top = "0";   // Aynı konumlandırma
  canvasWrapper.appendChild(drawingCanvas); // Doğru ebeveyn div
}

function clearLocalStorageForPreviousBook() {
  const keys = Object.keys(localStorage);
  const currentBookPrefix = `drawing_${baseImageName}_`;
  keys.forEach((key) => {
    if (key.startsWith("drawing_") && !key.startsWith(currentBookPrefix)) {
      localStorage.removeItem(key);
    }
  });
}

const startDragging = (e) => {
  if (e.target === toolsBoard || e.target.classList.contains("row")) {
    isDraggingToolsBoard = true; // Doğru değişkeni kullan
    offsetX = e.clientX - toolsBoard.offsetLeft;
    offsetY = e.clientY - toolsBoard.offsetTop;
    document.body.style.userSelect = "none";
  }
};

function drag(e) {
  if (!isDragging) return;

  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  const newLeft = initialLeft + deltaX;
  const newTop = initialTop + deltaY;

  const maxX = window.innerWidth - toolsBoard.offsetWidth;
  const maxY = window.innerHeight - toolsBoard.offsetHeight;

  toolsBoard.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
  toolsBoard.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
}

function stopDragging() {
  isDragging = false;
  document.body.style.userSelect = "";
}

const showImage = (num) => {
  const loadImage = (extension) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = `assets/books/${baseImageName}/${baseImageName}_Page_${num
        .toString()
        .padStart(2, "0")}.${extension}`;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };

  Promise.any([loadImage("png"), loadImage("jpg")])
    .then((img) => {
      
      canvas.width = img.width;
      canvas.height = img.height;
      drawingCanvas.width = img.width;
      drawingCanvas.height = img.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // setCanvasDimensions();
      
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;
      const scale = Math.min(window.innerWidth / img.width, window.innerHeight / img.height);
  

      // if (newHeight > maxHeight) {
      //   newHeight = maxHeight;
      //   newWidth = newHeight * aspectRatio;
      // }

      
      const canvasWrapper = document.querySelector(".canvas-wrapper");
      canvasWrapper.style.width = `${img.width * scale}px`;
      canvasWrapper.style.height = `${img.height * scale}px`;
      
      
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      // drawingCanvas.style.position = "absolute";
      // drawingCanvas.style.left = "0";
      // drawingCanvas.style.top = "0";
      drawingCanvas.style.width = "100%";
      drawingCanvas.style.height = "100%";
      
      // const scrollContainer = document.querySelector(".scroll-container");
      // scrollContainer.scrollLeft = (canvasWrapper.clientWidth - img.width * scale) / 2;
      // scrollContainer.scrollTop = (canvasWrapper.clientHeight - img.height * scale) / 2;
      
      const savedDrawing = localStorage.getItem(`drawing_Page_${num}`);
      if (savedDrawing) {
        const savedImg = new Image();
        savedImg.src = savedDrawing;
        savedImg.onload = () => {
          drawingCtx.drawImage(
            savedImg,
            0,
            0,
            drawingCanvas.width,
            drawingCanvas.height
          );
        };
      } else {
        clearDrawingCanvas();
      }
    })
    .catch((error) => {
      console.error("Resim yüklenemedi:", error);
    });
};


showImage(pageNum);
window.addEventListener("resize", () => {
  showImage(pageNum);
});

// Sayfa numarasını güncelleyen fonksiyon
function updatePageNumber() {
  currentPageElement.textContent = pageNum;
  totalPagesElement.textContent = totalPages;
}

// Sayfa yüklenirken toplam sayfa sayısını ve mevcut sayfa numarasını güncelle
window.addEventListener("load", () => {
  updatePageNumber();
});

// Sayfa değiştirme fonksiyonlarını güncelle
const nextPage = () => {
  if (pageNum < totalPages) {
    pageNum++;
    showImage(pageNum);
    clearDrawingCanvas();
    updatePageNumber(); // Sayfa numarasını güncelle
    resetZoom();
  }
};

const prevPage = () => {
  if (pageNum > 1) {
    pageNum--;
    showImage(pageNum);
    clearDrawingCanvas();
    updatePageNumber(); // Sayfa numarasını güncelle
    resetZoom();
  }
};

function clearDrawingCanvas() {
  drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

const startDraw = (e) => {
  if (selectedTool === "arrow") {
    startArrowDraw(e);
  } else {
    isDrawing = true;
    const { x, y } = getCanvasCoordinates(e);
    prevMouseX = x;
    prevMouseY = y;
    drawingCtx.beginPath();
    drawingCtx.lineWidth = brushWidth;

    try {
      undoStack.push(
        drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
      );
      redoStack = [];
      snapshot = drawingCtx.getImageData(
        0,
        0,
        drawingCanvas.width,
        drawingCanvas.height
      );
    } catch (error) {
      console.error("Error getting image data:", error);
    }

    setDrawingStyle();
  }
};

const undo = () => {
  if (undoStack.length > 0) {
    redoStack.push(
      drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
    );
    let lastState = undoStack.pop();
    drawingCtx.putImageData(lastState, 0, 0);
  }
};

const redo = () => {
  if (redoStack.length > 0) {
    undoStack.push(
      drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
    );
    let redoState = redoStack.pop();
    drawingCtx.putImageData(redoState, 0, 0);
  }
};

// Canvas'ın gerçek koordinatlarını hesaplamak için yardımcı fonksiyon
function getCanvasCoordinates(e) {
  const rect = drawingCanvas.getBoundingClientRect();
  const scaleX = drawingCanvas.width / rect.width;
  const scaleY = drawingCanvas.height / rect.height;
  
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  
  return { x, y };
}


const drawing = (e) => {
  if (!isDrawing) return;

  const { x, y } = getCanvasCoordinates(e);

  // Araç kontrolleri: Sadece seçilen araç için çizim yap
  if (selectedTool === "brush" || selectedTool === "eraser" || selectedTool === "marker") {
    if (snapshot) {
      drawingCtx.putImageData(snapshot, 0, 0);
    }
    drawingCtx.lineTo(x, y);
    drawingCtx.stroke();
  } else if (selectedTool === "rectangle" || selectedTool === "rectangle-filled") {
    if (snapshot) {
      drawingCtx.putImageData(snapshot, 0, 0);
    }
    drawRect(e);
  } else if (selectedTool === "circle" || selectedTool === "circle-filled") {
    if (snapshot) {
      drawingCtx.putImageData(snapshot, 0, 0);
    }
    drawCircle(e);
  } else if (selectedTool === "triangle" || selectedTool === "triangle-filled") {
    if (snapshot) {
      drawingCtx.putImageData(snapshot, 0, 0);
    }
    drawTriangle(e);
  } else if (selectedTool === "arrow") {
    drawArrow(e);
  }
};



const setDrawingStyle = () => {
  drawingCtx.lineWidth = brushWidth;
  drawingCtx.lineCap = "round";
  drawingCtx.lineJoin = "round";
  if (selectedTool === "eraser") {
    drawingCtx.globalCompositeOperation = "destination-out";
    drawingCtx.strokeStyle = "rgba(255,255,255,1)";
  } else {
    drawingCtx.globalCompositeOperation = "source-over";
    drawingCtx.strokeStyle = selectedColor;
  }

  if (selectedTool === "marker") {
    drawingCtx.strokeStyle = selectedColor;
    drawingCtx.globalAlpha = 0.5;
  } else {
    drawingCtx.globalAlpha = 1.0;
  }

  drawingCtx.fillStyle = selectedColor;
};
// Size slider'dan gelen değeri brushWidth'e atama
sizeSlider.addEventListener("input", () => {
  brushWidth = sizeSlider.value;
  setDrawingStyle(); // Boyut değiştiğinde stilin güncellenmesi için
});

const endDraw = () => {
  if (selectedTool === "arrow") {
    endDrawArrow();
  } else {
    isDrawing = false;
    snapshot = null;
  }

  // Çizimi kaydet
  const drawingData = drawingCanvas.toDataURL();
  localStorage.setItem(`drawing_Page_${pageNum}`, drawingData);
};
// Arrow drawing functions
const startArrowDraw = (e) => {
  if (selectedTool !== "arrow") return;

  isDrawing = true;
  arrowStartX = e.offsetX;
  arrowStartY = e.offsetY;

  try {
    undoStack.push(
      drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height)
    );
    redoStack = [];
    snapshot = drawingCtx.getImageData(
      0,
      0,
      drawingCanvas.width,
      drawingCanvas.height
    );
  } catch (error) {
    console.error("Error getting image data:", error);
  }
};

const drawArrow = (e) => {
  if (!isDrawing || selectedTool !== "arrow") return;
  drawingCtx.putImageData(snapshot, 0, 0);

  const arrowEndX = e.offsetX;
  const arrowEndY = e.offsetY;

  // Okun çizilmesi
  drawingCtx.lineWidth = brushWidth;
  drawingCtx.strokeStyle = selectedColor;

  drawArrowShape(
    drawingCtx,
    arrowStartX,
    arrowStartY,
    arrowEndX,
    arrowEndY,
    brushWidth,
    selectedColor
  );
};

function drawArrowShape(ctx, fromx, fromy, tox, toy, arrowWidth, color) {
  const headlen = arrowWidth * 2; // Ok başı uzunluğu
  const angle = Math.atan2(toy - fromy, tox - fromx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = arrowWidth;

  // Okun gövdesini çiz
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.stroke();

  // Ok başını çiz
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 7),
    toy - headlen * Math.sin(angle - Math.PI / 7)
  );
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 7),
    toy - headlen * Math.sin(angle + Math.PI / 7)
  );
  ctx.lineTo(tox, toy);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

const endDrawArrow = () => {
  if (selectedTool === "arrow") {
    isDrawing = false;
    snapshot = null;

    // Çizimi kaydet
    const drawingData = drawingCanvas.toDataURL();
    localStorage.setItem(`drawing_Page_${pageNum}`, drawingData);
  }
};

// Event listeners for drawing

// Dikdörtgen çizim fonksiyonu
const drawRect = (e) => {
  const { x, y } = getCanvasCoordinates(e);
  const width = x - prevMouseX;
  const height = y - prevMouseY;

  drawingCtx.beginPath(); // Yeni bir yol başlat
  if (selectedTool === "rectangle-filled") {
    drawingCtx.fillStyle = selectedColor; // Dolgu rengini ayarla
    drawingCtx.fillRect(prevMouseX, prevMouseY, width, height);
  } else if (selectedTool === "rectangle") {
    drawingCtx.strokeStyle = selectedColor; // Çizgi rengini ayarla
    drawingCtx.strokeRect(prevMouseX, prevMouseY, width, height);
  }
};




const drawCircle = (e) => {
  drawingCtx.beginPath();
  const { x, y } = getCanvasCoordinates(e);
  let radius = Math.sqrt(
    Math.pow(prevMouseX - x, 2) + Math.pow(prevMouseY - y, 2)
  );

  drawingCtx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
  if (selectedTool === "circle-filled") {
    drawingCtx.fillStyle = selectedColor; // Dolgu rengini ayarla
    drawingCtx.fill();
  } else if (selectedTool === "circle") {
    drawingCtx.strokeStyle = selectedColor; // Çizgi rengini ayarla
    drawingCtx.stroke();
  }
};




const drawTriangle = (e) => {
  drawingCtx.beginPath();
  const { x, y } = getCanvasCoordinates(e);

  drawingCtx.moveTo(prevMouseX, prevMouseY); // Başlangıç noktası
  drawingCtx.lineTo(x, y); // İkinci nokta
  drawingCtx.lineTo(prevMouseX * 2 - x, y); // Üçüncü nokta
  drawingCtx.closePath(); // Şekli kapat

  if (selectedTool === "triangle-filled") {
    drawingCtx.fillStyle = selectedColor; // Dolgu rengini ayarla
    drawingCtx.fill();
  } else if (selectedTool === "triangle") {
    drawingCtx.strokeStyle = selectedColor; // Çizgi rengini ayarla
    drawingCtx.stroke();
  }
};




toolBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const activeOption = document.querySelector(".tool .active");
    if (activeOption) {
      activeOption.classList.remove("active");
    }
    btn.classList.add("active");
    selectedTool = btn.id;
    console.log("Selected Tool:", selectedTool); // Debugging için eklendi

    // Şekil dolgu seçenekleri kontrolü
    if (selectedTool.includes("filled")) {
      selectedTool = selectedTool; // Dolgu şekli olduğu için değiştirme
    } else {
      fillColor.checked = false; // Diğer seçenekler için "fillColor"u kapat
    }

    setDrawingStyle();
  });
});




  // dropdownToolBtns.forEach((btn) => {
  //   btn.addEventListener("click", () => {
  //     const toolId = btn.id;
  //     selectedTool = toolId;

  //     if (toolId === "rectangle-filled") {
  //       fillColor.checked = true;
  //       selectedTool = "rectangle";
  //     } else if (toolId === "circle-filled") {
  //       fillColor.checked = true;
  //       selectedTool = "circle";
  //     } else if (toolId === "triangle-filled") {
  //       fillColor.checked = true;
  //       selectedTool = "triangle";
  //     } else if (toolId === "marker") {
  //       fillColor.checked = false;
  //     } else {
  //       fillColor.checked = false;
  //     }

  //     setDrawingStyle();
  //     document.querySelector(".dropdown-menu").style.display = "none";
  //   });
  // });

colorBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".options .selected").classList.remove("selected");
    btn.classList.add("selected");
    selectedColor = window
      .getComputedStyle(btn)
      .getPropertyValue("background-color");
    setDrawingStyle(); // Update drawing style with new color
  });
});

toolsBoard.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
    e.stopPropagation();
  }
});

drawingCanvas.addEventListener("mouseup", endDraw);
drawingCanvas.addEventListener("mousedown", startDraw);
drawingCanvas.addEventListener("mousemove", drawing);
drawingCanvas.addEventListener("mouseup", endDraw);
document.addEventListener("mouseup", endDraw);

colorPicker.addEventListener("change", () => {
  colorPicker.parentElement.style.background = colorPicker.value;
  colorPicker.parentElement.click();
});

clearCanvas.addEventListener("click", () => {
  drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  localStorage.removeItem(`drawing_Page_${pageNum}`); // Çizimi localStorage'dan sil
});

sizeSlider.addEventListener("change", () => {
  brushWidth = sizeSlider.value;
});

// saveImg.addEventListener("click", () => {
//   const link = document.createElement("a");
//   link.download = `${baseImageName}_Page_${pageNum.toString().padStart(2, "0")}.png`;
//   link.href = drawingCanvas.toDataURL();
//   link.click();
// });

const rgbToHex = (rgb) => {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
};

toolsBoard.addEventListener("mousedown", startDragging);

// toolsBoard.addEventListener("mousedown", (e) => {
//   // e.preventDefault(); // Olası varsayılan davranışları engelle
//   isDraggingToolsBoard = true;
//   offsetX = e.clientX - toolsBoard.offsetLeft;
//   offsetY = e.clientY - toolsBoard.offsetTop;
//   document.body.style.userSelect = "none"; // Seçim özelliğini kapat

// });

document.addEventListener("mousemove", (e) => {
  if (isDraggingToolsBoard) {
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    toolsBoard.style.left = `${newLeft}px`;
    toolsBoard.style.top = `${newTop}px`;
  }
});

document.addEventListener("mouseup", () => {
  if (isDraggingToolsBoard) {
    isDraggingToolsBoard = false;
    document.body.style.userSelect = ""; // Seçim özelliğini eski haline getir
  }
});

// document.addEventListener("mousemove", drag);
// document.addEventListener("mouseup", stopDragging);
// canvas.addEventListener("mousedown", startDraw);
// canvas.addEventListener("mousemove", drawing);
// canvas.addEventListener("mouseup", () => (isDrawing = false));

const updateZoom = () => {
  const canvasWrapper = document.querySelector(".canvas-wrapper");
  canvasWrapper.style.transform = `scale(${zoomLevel})`;
  canvasWrapper.style.transformOrigin = "top center"; // Ortayı hedefle

  // Canvas ve drawingCanvas için transform ayarlamaları
  canvas.style.transform = `scale(${zoomLevel})`;
  drawingCanvas.style.transform = `scale(${zoomLevel})`;
  canvas.style.transformOrigin = "top left";
  drawingCanvas.style.transformOrigin = "top left";

  // Scroll ayarlarını güncelleyin
  const scrollContainer = document.querySelector(".scroll-container");
  scrollContainer.scrollLeft = (canvasWrapper.clientWidth * zoomLevel - window.innerWidth) / 2;
  scrollContainer.scrollTop = (canvasWrapper.clientHeight * zoomLevel - window.innerHeight) / 2;
};


// Zoom in ve zoom out butonları
zoomInBtn.addEventListener("click", () => {
  if (zoomLevel < maxZoomLevel) {
    zoomLevel += 0.1;
    updateZoom();
  }
});

zoomOutBtn.addEventListener("click", () => {
  if (zoomLevel > minZoomLevel) {
    zoomLevel -= 0.1;
    updateZoom();
  }
});

// Zoom sıfırlama fonksiyonu
const resetZoom = () => {
  zoomLevel = 1; // Zoom seviyesini sıfırla
  updateZoom(); // Zoom'u güncelle

  // Canvas ve drawingCanvas'ın transform ayarlarını sıfırla
  canvas.style.transform = "none";
  drawingCanvas.style.transform = "none";

  // Scroll container'ı orijinal boyutuna getir ve scroll'u kaldır
  scrollContainer.style.width = "100%";
  scrollContainer.style.height = "100%";
  scrollContainer.style.overflow = "hidden";

  // Canvas'ı merkeze al
  scrollContainer.scrollLeft = 0;
  scrollContainer.scrollTop = 0;
};


document.addEventListener("DOMContentLoaded", function () {
  // const soundButtonsPanel = document.getElementById("sound-buttons-panel");
  const soundButtonsToggle = document.querySelector(
    ".tools-board .toolbar-head .right-icon"
  );

  soundButtonsToggle.addEventListener("click", function () {
    if (soundButtonsPanel.classList.contains("open")) {
      soundButtonsPanel.classList.remove("open");
    } else {
      soundButtonsPanel.classList.add("open");
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("expand").addEventListener("click", function () {
    if (
      !document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      // Tam ekran değil, tam ekran moduna geç
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        // Firefox
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        // Chrome, Safari, Opera
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        // IE/Edge
        document.documentElement.msRequestFullscreen();
      }
    } else {
      // Tam ekranda, tam ekran modundan çık
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        // Chrome, Safari, Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen();
      }
    }
  });

  document.getElementById("shrink").addEventListener("click", function () {
    window.location.href = "index.html";

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      // Chrome, Safari, Opera
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      // IE/Edge
      document.msExitFullscreen();
    }
  });
});

// JSON verisini JavaScript nesnesi olarak tanımla
const mediaData = {
  a1: {},
  bp1: {
    game: {
      8: "suHayattir8",
      15: "suHayattir15",
      17: "suHayattir17",
      18: "suHayattir18",
      28: "suHayattir28",
      29: "suHayattir29",
      34: "suHayattir34",
      41: "suHayattir41",
      44: "suHayattir44",
    },
    sound: {
      2: "sound2",
      5: "sound5",
      8: "sound8",
    },
    video: {
      3: "video3",
      5: "video5",
    },
    music: {
      3: "music3",
      4: "music4",
      5: "music5",
    },
  },
  bp2: {
    game: {
      9: "okulYolu9",
      20: "okulYolu20",
      21: "okulYolu21",
      27: "okulYolu27",
      36: "okulYolu36",
      37: "okulYolu37",
      39: "okulYolu39",
      40: "okulYolu40",
      42: "okulYolu42",
      48: "okulYolu48",
    },
  },
  bp3: {
    game: {
      3: "agaciSev3",
    },
  },
  bp4: {
    game: {
      8: "temizHava8",
      12: "temizHava12",
      14: "temizHava14",
      15: "temizHava15",
      18: "temizHava18",
      20: "temizHava20",
      26: "temizHava26",
      28: "temizHava28",
      36: "temizHava36",
    },
  },
  bp5: {},

  bp6: {
    game: {
      8: "suHayattir8",
      15: "suHayattir15",
      17: "suHayattir17",
      18: "suHayattir18",
      28: "suHayattir28",
      29: "suHayattir29",
      34: "suHayattir34",
      41: "suHayattir41",
      44: "suHayattir44",
    },
  },
  bp7: {
    game: {
      4: "toprakYasamdir4",
      5: "toprakYasamdir5",
      7: "toprakYasamdir7",
      18: "toprakYasamdir18",
      29: "toprakYasamdir29",
      33: "toprakYasamdir33",
      35: "toprakYasamdir35",
      46: "toprakYasamdir46",
      47: "toprakYasamdir47",
      48: "toprakYasamdir48",
    },
  },
  bp8: {
    game: {
      3: "agaciSev3",
      4: "agaciSev4",
      10: "agaciSev10",
      22: "agaciSev22",
      25: "agaciSev25",
      26: "agaciSev26",
      29: "agaciSev29",
      30: "agaciSev30",
      39: "agaciSev39",
      46: "agaciSev46",
    },
  },
  bp9: {
    game: {
      3: "denizTemizKalsin3",
      5: "denizTemizKalsin5",
      15: "denizTemizKalsin15",
      17: "denizTemizKalsin17",
      18: "denizTemizKalsin18",
      26: "denizTemizKalsin26",
      42: "denizTemizKalsin42",
      44: "denizTemizKalsin44",
      45: "denizTemizKalsin45",
    },
  },
  bp10: {},
};

// Mevcut sayfa numarasını tutan değişken (kodun içinde zaten tanımlı)

// // Buton tıklama olayını dinle
// document.getElementById("activity-btn").addEventListener("click", function () {
//   const currentPage = pageNum; // Mevcut sayfa numarası
//   const gamePath = gamesData[currentPage]; // JSON'dan oyunu al

//   if (gamePath) {
//     const gameUrl = `assets/books/bp8/game/${gamePath}/story.html`;
//     window.open(gameUrl, '_blank'); // Oyunu yeni sekmede aç
//   } else {
//     console.log("Bu sayfada tanımlı bir oyun yok.");
//   }
// });

document.addEventListener("DOMContentLoaded", function () {
  const openMedia = (type) => {
    const currentPage = pageNum;
    const currentBookMedia = mediaData[baseImageName];
    const mediaFiles = currentBookMedia[type]
      ? currentBookMedia[type][currentPage]
      : null;

    if (mediaFiles) {
      const filesArray = Array.isArray(mediaFiles) ? mediaFiles : [mediaFiles]; // Dizi kontrolü
      filesArray.forEach((mediaPath) => {
        const mediaUrl = `assets/books/${baseImageName}/${type}/${mediaPath}`;
        if (type === "game") {
          window.open(`${mediaUrl}/story.html`, "_blank"); // Yeni pencerede aç
        } else if (type === "sound") {
          const audio = new Audio(`${mediaUrl}.mp3`);
          audio.play(); // Mevcut pencerede çal
        } else if (type === "music") {
          window.open(`${mediaUrl}.mp3`, "_blank"); // Yeni pencerede aç
        } else if (type === "video") {
          window.open(`${mediaUrl}.mp4`, "_blank"); // Yeni pencerede aç
        }
      });
    } else {
      console.log(`Bu sayfa için tanımlı bir ${type} yok.`);
    }
  };

  // Buton olay dinleyicileri
  document
    .getElementById("activity-btn")
    .addEventListener("click", function () {
      openMedia("game");
    });
  document
    .getElementById("sound-buttons-panel")
    .addEventListener("click", function () {
      openMedia("sound");
    });
  document.getElementById("video-btn").addEventListener("click", function () {
    openMedia("video");
  });
  document.getElementById("music-btn").addEventListener("click", function () {
    openMedia("music");
  });
});

// Pan modunu başlatan ve bitiren fonksiyonlar
// const togglePanMode = () => {
//   isPanMode = !isPanMode;
//   document.body.style.cursor = isPanMode ? "grab" : "default";
// };

document.getElementById("undo-btn").addEventListener("click", undo);
document.getElementById("redo-btn").addEventListener("click", redo);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", stopDragging);
document.getElementById("next-page").addEventListener("click", nextPage);
document.getElementById("prev-page").addEventListener("click", prevPage);

// toggleModeBtn.addEventListener("click", togglePanMode);
// drawingCanvas.addEventListener("mousedown", startDraw);
// drawingCanvas.addEventListener("mousemove", drawing);

// drawingCanvas.addEventListener("mouseup", () => {
//   isDrawing = false;
//   drawingCtx.globalCompositeOperation = "source-over"; // Silgi kullanımından sonra normal çizim moduna dön

//   // Çizimi kaydet
//   const drawingData = drawingCanvas.toDataURL();
//   localStorage.setItem(`drawing_Page_${pageNum}`, drawingData);
// });

// document.getElementById('shapes-icon').addEventListener('click', function() {
//   var dropdown = document.querySelector('.dropdown-menu');
//   var isVisible = dropdown.style.display === 'block';

//   // Diğer dropdown menüleri varsa, onları kapat
//   document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
//     menu.style.display = 'none';
//   });

//   // Tıklanan menüyü aç/kapat
//   dropdown.style.display = isVisible ? 'none' : 'block';
// });

// // Menü dışında tıklama ile menüyü kapat
// document.addEventListener('click', function(event) {
//   var target = event.target;
//   var dropdown = document.querySelector('.dropdown-menu');

//   if (!target.closest('#sekiller') && dropdown.style.display === 'block') {
//     dropdown.style.display = 'none';
//   }
// });

function startPan(e) {
  if (isDrawing) return;
  isPanning = true;
  startPanX = e.clientX - panOffsetX;
  startPanY = e.clientY - panOffsetY;
  document.body.style.cursor = "grabbing";
}

function pan(e) {
  if (!isPanning || isDrawing) return;

  // Pan hareketiyle kaydırma pozisyonlarını ayarla
  const deltaX = e.clientX - startPanX;
  const deltaY = e.clientY - startPanY;

  scrollContainer.scrollLeft = scrollContainer.scrollLeft - deltaX;
  scrollContainer.scrollTop = scrollContainer.scrollTop - deltaY;

  startPanX = e.clientX;
  startPanY = e.clientY;
}

function endPan() {
  isPanning = false;
  document.body.style.cursor = "default";
}

// script.js

document.addEventListener("DOMContentLoaded", () => {
  // Sayfa numarası popup işlemleri
  const popup = document.getElementById("popup");
  const openPopupButton = document.getElementById("page-number");
  const closePopupButton = document.querySelector(".popup .close");
  const goButton = document.getElementById("go-button");
  const pageInput = document.getElementById("page-input");
  const numButtons = document.querySelectorAll(
    ".num-buttons button:not(#clear, #go-button)"
  );
  const clearButton = document.getElementById("clear");
  const currentPageElement = document.getElementById("current-page");

  let isDragging = false;
  let startX, startY;

  scrollContainer.addEventListener("mousedown", startPan);
  scrollContainer.addEventListener("mousemove", pan);
  scrollContainer.addEventListener("mouseup", endPan);
  scrollContainer.addEventListener("mouseleave", endPan);

  scrollContainer.addEventListener("mousedown", (e) => {
    if (e.target !== toolsBoard && !isDraggingToolsBoard && !isDrawing) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = scrollContainer.scrollLeft;
      initialTop = scrollContainer.scrollTop;
      document.body.style.cursor = "grabbing";
    }
  });

  scrollContainer.addEventListener("mousemove", (e) => {
    if (!isDragging || isDrawing) return; // Çizim yapılıyorsa hareket ettirmeyi engelle

    const deltaX = startX - e.clientX;
    const deltaY = startY - e.clientY;
    scrollContainer.scrollLeft = initialLeft + deltaX;
    scrollContainer.scrollTop = initialTop + deltaY;
  });

  scrollContainer.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.cursor = "default";
  });

  scrollContainer.addEventListener("mouseleave", () => {
    isDragging = false;
    document.body.style.cursor = "default";
  });

  // document.addEventListener("mouseup", () => {
  //   isDragging = false;
  // });

  // // Keyboard popup işlemleri
  // const keyboardPopup = document.getElementById("keyboard-popup");
  // const openKeyboardButton = document.getElementById("open-keyboard-btn");
  // const closeKeyboardButton = document.getElementById("close-keyboard");
  // const keyboardInput = document.getElementById("keyboard-input");
  // const keys = document.querySelectorAll("#keyboard .keypad .key");
  // const clearKeyboardButton = document.getElementById("clear-keyboard");
  // const submitKeyboardButton = document.getElementById("submit-keyboard");

  // Sayfa numarası popup işlemleri
  openPopupButton.addEventListener("click", () => {
    pageInput.value = "sayfa no"; // Input'u temizle
    popup.style.display = "flex";
  });

  closePopupButton.addEventListener("click", () => {
    popup.style.display = "none";
  });

  numButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Eğer "sayfa no" yazısı varsa, temizle
      if (pageInput.value === "sayfa no") {
        pageInput.value = "";
      }
      // Rakamı ekle
      pageInput.value += button.textContent;
    });
  });

  clearButton.addEventListener("click", () => {
    pageInput.value = "sayfa no";
  });

  goButton.addEventListener("click", () => {
    const pageNumber = parseInt(pageInput.value, 10);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      pageNum = pageNumber;
      showImage(pageNum);
      clearDrawingCanvas();
      currentPageElement.textContent = pageNum; // Sayfa numarasını güncelle
      popup.style.display = "none";
    }
  });

  // // Keyboard popup işlemleri
  // openKeyboardButton.addEventListener("click", () => {
  //   keyboardPopup.style.display = "flex";
  // });

  // closeKeyboardButton.addEventListener("click", () => {
  //   keyboardPopup.style.display = "none";
  // });

  // keys.forEach(key => {
  //   key.addEventListener("click", () => {
  //     keyboardInput.value += key.textContent;
  //   });
  // });

  // clearKeyboardButton.addEventListener("click", () => {
  //   keyboardInput.value = "";
  // });

  // submitKeyboardButton.addEventListener("click", () => {
  //   // Canvas'a yazıyı ekleme
  //   ctx.font = "20px Arial";
  //   ctx.fillStyle = "#000"; // Yazı rengini ayarlayın
  //   ctx.fillText(keyboardInput.value, 50, 50); // Yazıyı canvas üzerinde belirli bir pozisyona çizin

  //   keyboardPopup.style.display = "none";
  //   keyboardInput.value = ""; // Giriş alanını temizle
  // });

  // Popup dışına tıklayınca kapat
  window.addEventListener("click", (event) => {
    if (event.target === popup) {
      popup.style.display = "none";
    }
    // if (event.target === keyboardPopup) {
    //   keyboardPopup.style.display = "none";
    // }
  });
});
