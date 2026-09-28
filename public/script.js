const API_URL = 'http://localhost:5000/api/products';

const form = document.getElementById('product-form');
const productsList = document.getElementById('products-list');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const idInput = document.getElementById('product-id');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');

// Charger et afficher tous les produits
async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    const products = await res.json();
    renderProducts(products);
  } catch (err) {
    productsList.innerHTML = '<p>Erreur de chargement des produits.</p>';
  }
}

function renderProducts(products) {
  productsList.innerHTML = '';
  if (products.length === 0) {
    productsList.innerHTML = '<p>Aucun produit pour le moment.</p>';
    return;
  }
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <div class="product-info">
        <strong>${p.name}</strong>
        <span>${p.price} € — Quantité: ${p.quantity}</span>
      </div>
      <div class="product-actions">
        <button class="edit-btn" onclick="editProduct(${p.id}, '${p.name}', ${p.price}, ${p.quantity})">Modifier</button>
        <button class="delete-btn" onclick="deleteProduct(${p.id})">Supprimer</button>
      </div>
    `;
    productsList.appendChild(div);
  });
}

// Ajouter ou modifier un produit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = idInput.value;
  const data = {
    name: nameInput.value,
    price: parseFloat(priceInput.value),
    quantity: parseInt(quantityInput.value)
  };

  try {
    if (id) {
      // Modification
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Création
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    resetForm();
    loadProducts();
  } catch (err) {
    alert('Erreur lors de l\'enregistrement.');
  }
});

// Pré-remplir le formulaire pour modification
function editProduct(id, name, price, quantity) {
  idInput.value = id;
  nameInput.value = name;
  priceInput.value = price;
  quantityInput.value = quantity;
  submitBtn.textContent = 'Modifier';
  cancelBtn.style.display = 'inline-block';
}

// Annuler la modification
cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  form.reset();
  idInput.value = '';
  submitBtn.textContent = 'Ajouter';
  cancelBtn.style.display = 'none';
}

// Supprimer un produit
async function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    loadProducts();
  } catch (err) {
    alert('Erreur lors de la suppression.');
  }
}

// Charger les produits au démarrage
loadProducts();