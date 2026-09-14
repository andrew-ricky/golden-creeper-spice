// Default Admin Credentials
const ADMIN_USER = "admin";
const ADMIN_PASS = "golden123";

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (u === ADMIN_USER && p === ADMIN_PASS) {
      localStorage.setItem('adminLoggedIn', 'true');
      window.location.href = 'admin.html';
    } else {
      alert('Invalid Username or Password!');
    }
  });
}

function checkAuth() {
  if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
}

function logoutAdmin() {
  localStorage.removeItem('adminLoggedIn');
  window.location.href = 'login.html';
}

const addForm = document.getElementById('add-product-form');
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value;
    const category = document.getElementById('p-category').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const image_url = document.getElementById('p-image').value;
    const description = document.getElementById('p-desc').value;

    const { error } = await supabaseClient.from('products').insert([{ name, category, price, image_url, description }]);

    if (error) alert(error.message);
    else {
      alert('Product added successfully!');
      addForm.reset();
      loadAdminProducts();
    }
  });
}

async function loadAdminProducts() {
  const { data, error } = await supabaseClient.from('products').select('*');
  if (error) return;

  const tbody = document.getElementById('admin-product-list');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.name}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.category}</td>
        <td><button style="background:red;" onclick="deleteProduct(${p.id})">Delete</button></td>
      </tr>
    `;
  });
}

async function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    if (!error) loadAdminProducts();
    else alert(error.message);
  }
}