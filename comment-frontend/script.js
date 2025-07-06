let token = '';

async function register() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  alert(data?.message || 'Registered!');
}

async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (data.access_token) {
    token = data.access_token;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('comment-section').style.display = 'block';
    fetchComments();
  } else {
    alert('Login failed');
  }
}

async function postComment() {
  const content = document.getElementById('comment-content').value;

  const res = await fetch('http://localhost:3000/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ content }),
  });

  const data = await res.json();
  if (res.ok) {
    alert('Comment posted!');
    document.getElementById('comment-content').value = '';
    fetchComments();
  } else {
    alert(data.message || 'Failed to post comment');
  }
}

async function fetchComments() {
  const res = await fetch('http://localhost:3000/comments');
  const comments = await res.json();

  const container = document.getElementById('comments');
  container.innerHTML = '';

  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `<strong>${c.user.username}</strong><p>${c.content}</p>`;
    container.appendChild(div);
  });
}
