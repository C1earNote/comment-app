const api = 'http://localhost:3000';
let token = '';
let replyTo = null;

async function register() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch(`${api}/auth/register`, {
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

  const res = await fetch(`${api}/auth/login`, {
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

  const res = await fetch(`${api}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ content, parentId: replyTo }),
  });

  const data = await res.json();
  if (res.ok) {
    alert('Comment posted!');
    document.getElementById('comment-content').value = '';
    replyTo = null;
    fetchComments();
  } else {
    alert(data.message || 'Failed to post comment');
  }
}

async function fetchComments() {
  const res = await fetch(`${api}/comments`);
  const comments = await res.json();
  const container = document.getElementById('comments');
  container.innerHTML = '';

  for (const comment of comments) {
    const div = await renderComment(comment);
    container.appendChild(div);
  }
}

async function renderComment(comment, depth = 0) {
  const div = document.createElement('div');
  div.className = 'comment';
  div.style.marginLeft = `${depth * 30}px`;

  div.innerHTML = `
    <strong>${comment.user.username}</strong>
    <p>${comment.deleted ? '[Deleted]' : comment.content}</p>
    ${!comment.deleted ? `
      <button onclick="replyComment(${comment.id})">Reply</button>
      <button onclick="editComment(${comment.id})">Edit</button>
      <button onclick="deleteComment(${comment.id})">Delete</button>
    ` : `<button onclick="restoreComment(${comment.id})">Restore</button>`}
  `;

  // Fetch replies
  const repliesRes = await fetch(`${api}/comments/${comment.id}/replies`);
  const replies = await repliesRes.json();

  for (const reply of replies) {
    const replyDiv = await renderComment(reply, depth + 1);
    div.appendChild(replyDiv);
  }

  return div;
}

function replyComment(parentId) {
  replyTo = parentId;
  const textarea = document.getElementById('comment-content');
  textarea.focus();
  textarea.placeholder = 'Replying to comment #' + parentId;
}

async function deleteComment(id) {
  const res = await fetch(`${api}/comments/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  fetchComments();
}

async function restoreComment(id) {
  const res = await fetch(`${api}/comments/${id}/restore`, {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  fetchComments();
}

async function editComment(id) {
  const newContent = prompt('Edit your comment:');
  if (!newContent) return;

  const res = await fetch(`${api}/comments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ content: newContent })
  });

  const data = await res.json();
  if (res.ok) {
    fetchComments();
  } else {
    alert(data.message || 'Failed to edit comment');
  }
}
