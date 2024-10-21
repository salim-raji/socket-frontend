let users = [];
let selectedUser = null;
let image = null;

const hosturl = "http://localhost:4000"
const socket = io(hosturl);

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
  subscribeUserToPush();

  document.getElementById('addUserBtn').addEventListener('click', openAddPopup);
  document.getElementById('addForm').addEventListener('submit', submitAdd);
  document.getElementById('editForm').addEventListener('submit', submitEdit);
  document.getElementById('addImage').addEventListener('change', handleFileChange);
  document.getElementById('editImage').addEventListener('change', handleFileChange);
});



function subscribeUserToPush() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/socket-frontend/service-worker.js')
      .then(function (registration) {
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('BMxcrvZIF9H2bz7koJhag9g96Thx8drIJ7EoWYwORS97bRreZ9jimch8HaZMeLqR4E-IiWiSJAb72-V6Exuaj1M'
),
        });
      })
      .then(function (subscription) {
        return fetch(`${hosturl}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
      })
      .catch(function (error) {
        console.error('Error during subscription', error);
      });
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function fetchUsers() {
  fetch(`${hosturl}/users`)
    .then((response) => response.json())
    .then((data) => {
      users = data;
      renderUsers();
    })
    .catch((error) => console.error('Error fetching users:', error));
}

function renderUsers() {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.classList.add('user-card');
    li.innerHTML = `
      <div class="user-info">
        ${user.imageUrl ? `<img src="${user.imageUrl}" alt="user image" />` : ''}
        <p><strong>${user.name}</strong></p>
        <p>Email: ${user.email}</p>
      </div>
      <div class="user-actions">
        <button onclick="openEditPopup('${user._id}')">Edit</button>
        <button onclick="deleteUser('${user._id}')">Delete</button>
      </div>
    `;
    userList.appendChild(li);
  });
}

function openAddPopup() {
  document.getElementById('addModal').style.display = 'block';
}

function closeAddPopup() {
  document.getElementById('addModal').style.display = 'none';
}

function openEditPopup(userId) {
  selectedUser = users.find((user) => user._id === userId);
  document.getElementById('editName').value = selectedUser.name;
  document.getElementById('editEmail').value = selectedUser.email;
  document.getElementById('editModal').style.display = 'block';
}

function closeEditPopup() {
  document.getElementById('editModal').style.display = 'none';
  selectedUser = null;
}

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function submitAdd(event) {
  event.preventDefault();
  const name = document.getElementById('addName').value;
  const email = document.getElementById('addEmail').value;

  fetch(`${hosturl}/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      email: email,
      imageUrl: image,
    }),
  })
    .then((response) => response.json())
    .then((data) => {

      closeAddPopup();
    })
    .catch((error) => console.error('Error adding user:', error));
}

function submitEdit(event) {
  event.preventDefault();
  const name = document.getElementById('editName').value;
  const email = document.getElementById('editEmail').value;

  fetch(`${hosturl}/update/${selectedUser._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      email: email,
      imageUrl: image || selectedUser.imageUrl,
    }),
  })
    .then((response) => response.json())
    .then(() => {
      fetchUsers();
      closeEditPopup();
    })
    .catch((error) => console.error('Error updating user:', error));
}

function deleteUser(userId) {
  fetch(`${hosturl}/delete/${userId}`, {
    method: 'DELETE',
  })
    .then(() => {
      users = users.filter((user) => user._id !== userId);
      renderUsers();
    })
    .catch((error) => console.error('Error deleting user:', error));
}


socket.on('user-added', (newUser) => {
  users.push(newUser); 
  renderUsers();
  
});


socket.on('user-updated', (updatedUser) => {
  users = users.map((user) => (user._id === updatedUser._id ? { ...user, ...updatedUser.updates } : user));
  renderUsers();
});

socket.on('user-deleted', (userId) => {
  users = users.filter((user) => user._id !== userId);
  renderUsers();
  
 
});
