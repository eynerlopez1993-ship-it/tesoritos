// ----------------- Configuración -----------------
const numeroWhatsApp = "50575452697";

let productos = [];
let carrito = [];
let indiceActual = 0;

// ----------------- DOM Elements -----------------
const galeria = document.getElementById("galeria");
const btnCarrito = document.getElementById("btn-carrito");
const carritoPanel = document.getElementById("carrito-panel");
const carritoItems = document.getElementById("carrito-items");
const carritoTotal = document.getElementById("carrito-total");
const btnCerrarCarrito = document.getElementById("cerrar-carrito");
const btnWhatsapp = document.getElementById("btn-whatsapp");
const toastContainer = document.getElementById("toast-container");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const contenedorFiltros = document.getElementById("filtros"); // <--- agregado para filtros

// ----------------- Toast -----------------
function mostrarToast(mensaje) {
  const toast = document.createElement("div");
  toast.className = "bg-pink-500 text-white px-4 py-2 rounded shadow-md animate-slide-in";
  toast.textContent = mensaje;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ----------------- Cargar productos -----------------
async function cargarProductos() {
  try {
    const res = await fetch("productos.json");
    const categorias = await res.json();           
    productos = categorias.flatMap(c => 
      c.productos.map(p => ({ ...p, categoria: c.categoria })) // <--- conserva la categoría
    );

    mostrarProductos(productos);
    generarFiltros(productos);

    const buscador = document.getElementById("buscador");
    if (buscador) {
      buscador.addEventListener("input", () => {
        const texto = buscador.value.toLowerCase();
        const filtrados = productos.filter(p =>
          p.nombre.toLowerCase().includes(texto) ||
          p.descripcion.toLowerCase().includes(texto)
        );
        mostrarProductos(filtrados);
      });
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
    galeria.innerHTML = "<p class='text-red-500 col-span-3'>No se pudieron cargar los productos.</p>";
  }
}

// ----------------- Mostrar productos -----------------
function mostrarProductos(lista) {
  galeria.innerHTML = "";
  galeria.className = "";

  if (!lista.length) {
    galeria.innerHTML = "<p class='text-center text-red-500'>No se encontraron productos.</p>";
    return;
  }

  if (lista.length === 1) {
    galeria.classList.add("galeria-adaptativa");
  } else {
    galeria.classList.add("grid", "grid-cols-1", "sm:grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4", "gap-6", "p-4");
  }

  lista.forEach((p, index) => {
    const card = document.createElement("div");
    card.className = lista.length === 1
      ? "producto-card bg-white rounded-3xl shadow-lg p-4 max-w-md w-full flex flex-col items-center"
      : "producto-card bg-white rounded-3xl shadow-lg p-3 sm:p-4 flex flex-col";

    card.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}" class="w-full h-auto object-contain rounded-2xl mb-3 cursor-pointer">
      <h3 class="text-xl font-bold text-pink-600 mb-1">${p.nombre}</h3>
      <p class="text-green-700 font-semibold mb-3">C$${p.precio.toFixed(2)}</p>
      <div class="flex gap-2 w-full">
        <button data-index="${index}" class="add-carrito bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl flex-1">Añadir 🛒</button>
        <a href="https://wa.me/${numeroWhatsApp}?text=Hola! Estoy interesado en el producto: ${encodeURIComponent(p.nombre + ' C$' + p.precio.toFixed(2))}"
           target="_blank"
           class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex-1 text-center">WhatsApp</a>
      </div>
    `;
    galeria.appendChild(card);
  });

  galeria.querySelectorAll(".add-carrito").forEach(btn => {
    btn.onclick = () => {
      const index = btn.dataset.index;
      agregarAlCarrito(productos[index]);
      mostrarToast(`${productos[index].nombre} agregado al carrito`);
    };
  });
}

// ----------------- Carrito -----------------
function agregarAlCarrito(producto) {
  const existente = carrito.find(p => p.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(p => p.id !== id);
  actualizarCarritoUI();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(p => p.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) eliminarDelCarrito(id);
  else actualizarCarritoUI();
}

function actualizarCarritoUI() {
  carritoItems.innerHTML = "";
  let total = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;

    const item = document.createElement("div");
    item.className = "flex justify-between items-center border-b py-2";
    item.innerHTML = `
      <div class="flex items-center gap-2">
        <img src="${p.imagen}" class="w-12 h-12 object-contain rounded" />
        <div>
          <p class="font-semibold">${p.nombre}</p>
          <p class="text-sm text-gray-600">C$${p.precio.toFixed(2)}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-2 py-1 bg-gray-200 rounded" data-action="menos">-</button>
        <span>${p.cantidad}</span>
        <button class="px-2 py-1 bg-gray-200 rounded" data-action="mas">+</button>
        <button class="text-red-500 text-sm ml-2" data-action="eliminar">Eliminar</button>
      </div>
    `;

    item.querySelector('[data-action="menos"]').addEventListener("click", () => cambiarCantidad(p.id, -1));
    item.querySelector('[data-action="mas"]').addEventListener("click", () => cambiarCantidad(p.id, 1));
    item.querySelector('[data-action="eliminar"]').addEventListener("click", () => eliminarDelCarrito(p.id));

    carritoItems.appendChild(item);
  });

  carritoTotal.textContent = `C$${total.toFixed(2)}`;

  if (carrito.length > 0) {
    btnWhatsapp.classList.remove("opacity-50", "cursor-not-allowed");
    btnWhatsapp.removeAttribute("disabled");

    let mensaje = "Hola! Quiero hacer un pedido:\n";
    carrito.forEach(p => {
      mensaje += `- ${p.nombre} x${p.cantidad}: C$${(p.precio * p.cantidad).toFixed(2)}\n`;
    });
    mensaje += `Total: C$${total.toFixed(2)}`;

    btnWhatsapp.href = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  } else {
    btnWhatsapp.classList.add("opacity-50", "cursor-not-allowed");
    btnWhatsapp.setAttribute("disabled", true);
    btnWhatsapp.href = "#";
  }
}

btnWhatsapp.addEventListener("click", (e) => {
  if (carrito.length === 0) {
    e.preventDefault();
    mostrarToast("Debe agregar al carrito antes de enviar el pedido");
  }
});

btnCarrito.addEventListener("click", () => {
  carritoPanel.classList.add("flex");
  setTimeout(() => {
    carritoPanel.classList.remove("opacity-0");
  }, 10);
});

btnCerrarCarrito.addEventListener("click", () => {
  carritoPanel.classList.add("opacity-0");
  setTimeout(() => {
    carritoPanel.classList.remove("flex");
  }, 300);
});

// ----------------- Lightbox -----------------
function abrirLightbox(indice) {
  indiceActual = indice;
  lightboxImg.src = productos[indiceActual].imagen;
  lightbox.classList.remove("hidden");
  setTimeout(() => lightbox.classList.add("flex"), 10);
}

function cerrarLightbox() {
  lightbox.classList.remove("flex");
  setTimeout(() => lightbox.classList.add("hidden"), 300);
}

function siguienteProducto() {
  indiceActual = (indiceActual + 1) % productos.length;
  lightboxImg.src = productos[indiceActual].imagen;
}

function productoAnterior() {
  indiceActual = (indiceActual - 1 + productos.length) % productos.length;
  lightboxImg.src = productos[indiceActual].imagen;
}

galeria.addEventListener("click", (e) => {
  const img = e.target.closest("img");
  if (!img) return;

  const clickedSrc = img.getAttribute("src");
  const indice = productos.findIndex(p => p.imagen === clickedSrc);
  if (indice !== -1) abrirLightbox(indice);
});

let scale = 1;
let isDragging = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;

function aplicarTransform() {
  lightboxImg.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
}

lightboxImg.addEventListener("wheel", e => {
  e.preventDefault();
  scale += e.deltaY < 0 ? 0.1 : -0.1;
  scale = Math.min(Math.max(1, scale), 3);
  aplicarTransform();
});

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  aplicarTransform();
}

lightboxClose.addEventListener("click", () => { resetZoom(); cerrarLightbox(); });
lightbox.addEventListener("click", e => { 
  if (e.target === lightbox) { 
    resetZoom(); 
    cerrarLightbox(); 
  } 
});

lightboxImg.addEventListener("mousedown", e => {
  if (scale <= 1) return;
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  lightboxImg.style.cursor = "grabbing";
});

window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  aplicarTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  lightboxImg.style.cursor = "grab";
});

nextBtn.addEventListener("click", siguienteProducto);
prevBtn.addEventListener("click", productoAnterior);

let touchStartX = 0, touchEndX = 0;
lightbox.addEventListener("touchstart", e => touchStartX = e.changedTouches[0].screenX);
lightbox.addEventListener("touchend", e => {
  touchEndX = e.changedTouches[0].screenX;
  if (touchEndX < touchStartX - 50) siguienteProducto();
  if (touchEndX > touchStartX + 50) productoAnterior();
});

// ----------------- Filtros dinámicos -----------------
function generarFiltros(productos) {
  if (!contenedorFiltros) return;
  contenedorFiltros.innerHTML = "";

  const btnAccesorios = document.createElement("button");
  // Botón principal
btnAccesorios.className = "categoria-btn bg-green-300 hover:bg-green-400 px-3 py-1 rounded-xl font-semibold transition duration-300 mr-2 mb-2";
  btnAccesorios.textContent = "Accesorios ▾";
  contenedorFiltros.appendChild(btnAccesorios);

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];
  const botonesCategorias = categorias.map(cat => {
    const boton = document.createElement("button");
    // Botones de categorías
boton.className = "categoria-btn bg-green-200 hover:bg-green-300 px-3 py-1 rounded-xl font-semibold transition duration-300 mr-2 mb-2";
    boton.textContent = cat;
    boton.dataset.categoria = cat;
    boton.style.display = "none";
    boton.addEventListener("click", () => {
      const filtrados = cat === "Todos" ? productos : productos.filter(p => p.categoria === cat);
      mostrarProductos(filtrados);
    });
    contenedorFiltros.appendChild(boton);
    return boton;
  });

  let visible = false;
  btnAccesorios.addEventListener("click", () => {
    visible = !visible;
    botonesCategorias.forEach(b => b.style.display = visible ? "inline-block" : "none");
    btnAccesorios.textContent = visible ? "Accesorios ▲" : "Accesorios ▾";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const tesoritos = document.getElementById("tesoritos-glow");
  if (!tesoritos) return;
  tesoritos.classList.add("glow-effect");
});

// ----------------- Ejecutar -----------------
cargarProductos();
