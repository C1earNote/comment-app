import React, { useState, useEffect } from 'react';

const API = 'https://comment-app-iv7g.onrender.com';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState('');
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchComments();
    if (token) {
      const payload = parseJwt(token);
      setUserId(payload?.sub || null);
      fetchNotifications(payload?.sub);
    }
  }, [token]);

  const fetchComments = async () => {
    const res = await fetch(`${API}/comments`);
    const data = await res.json();
    setComments(data);
  };

  const fetchNotifications = async (uid = userId) => {
    if (!uid) return;
    try {
      const res = await fetch(`${API}/notifications/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data);
    } catch {
      console.log('No notifications route or unauthorized.');
    }
  };

  const handleAuth = async () => {
    const endpoint = isLogin ? 'login' : 'register';

    try {
      const res = await fetch(`${API}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (!isLogin && res.status === 500) {
          alert('User already exists!');
        } else {
          alert(data.message || 'Authentication failed');
        }
        return;
      }

      if (data.access_token) {
        setToken(data.access_token);
      } else {
        alert('Registered! Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      alert('Something went wrong.');
    }
  };

  const postComment = async () => {
    if (!commentContent.trim()) {
      alert('Comment cannot be empty!');
      return;
    }

    const res = await fetch(`${API}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: commentContent }),
    });

    if (res.ok) {
      setCommentContent('');
      fetchComments();
    }
  };

  const postReply = async (parentId) => {
    if (!replyContent.trim()) {
      alert('Reply cannot be empty!');
      return;
    }

    const res = await fetch(`${API}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: replyContent, parentId }),
    });

    if (res.ok) {
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
      fetchNotifications();
    }
  };

  const handleEdit = async (id) => {
    if (!editContent.trim()) {
      alert('Content cannot be empty!');
      return;
    }

    const res = await fetch(`${API}/comments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: editContent }),
    });

    if (res.ok) {
      setEditingId(null);
      fetchComments();
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to edit');
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API}/comments/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      fetchComments();
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to delete');
    }
  };

  const handleRestore = async (id) => {
    const res = await fetch(`${API}/comments/${id}/restore`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      fetchComments();
    } else {
      const data = await res.json();
      alert(data.message || 'Cannot restore');
    }
  };

  const renderComments = (list, depth = 0) =>
    list.map((comment) => (
      <div
        key={comment.id}
        style={{
          marginLeft: depth * 20,
          borderLeft: '2px solid #ccc',
          paddingLeft: 10,
          marginTop: 10,
          backgroundColor: comment.deleted ? '#fdd' : '#f9f9f9',
          borderRadius: 6,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ color: '#2d72d9' }}>
            {comment.user?.username || 'Deleted User'}
          </strong>
          <span style={{ fontSize: 12, color: '#888' }}>
            (ID: {comment.user?.id || 'N/A'})
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>
            {new Date(comment.createdAt).toLocaleString()}
          </span>
          {comment.deleted && <span style={{ color: 'red', fontWeight: 600 }}>Deleted</span>}
        </div>
        <div style={{ marginTop: 4, marginBottom: 4 }}>
          <span style={{ fontWeight: 500 }}>Comment ID: {comment.id}</span>
          {comment.parent && (
            <span style={{ marginLeft: 10, fontSize: 12, color: '#666' }}>
              Replying to: {comment.parent.id}
            </span>
          )}
        </div>
        <div style={{ marginBottom: 6 }}>
          {editingId === comment.id ? (
            <>
              <textarea
                rows="2"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ width: '100%' }}
              />
              <br />
              <button onClick={() => handleEdit(comment.id)}>Save</button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <span style={{ fontSize: 16 }}>{comment.content}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!comment.deleted && (
            <>
              <button onClick={() => setReplyingTo(comment.id)}>Reply</button>
              <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>Edit</button>
              <button onClick={() => handleDelete(comment.id)}>Delete</button>
            </>
          )}
          {comment.deleted && (
            <button onClick={() => handleRestore(comment.id)}>Restore</button>
          )}
        </div>
        {replyingTo === comment.id && (
          <div style={{ marginTop: 8 }}>
            <textarea
              rows="2"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              style={{ width: '100%' }}
            />
            <br />
            <button onClick={() => postReply(comment.id)}>Submit Reply</button>
            <button onClick={() => setReplyingTo(null)}>Cancel</button>
          </div>
        )}
        {comment.children?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {renderComments(comment.children, depth + 1)}
          </div>
        )}
      </div>
    ));

  return (
    <div style={{ padding: 20 }}>
      {!token ? (
        <div>
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          /><br /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          /><br /><br />
          <button onClick={handleAuth}>{isLogin ? 'Login' : 'Register'}</button>
          <p style={{ cursor: 'pointer', color: 'blue' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Create an account' : 'Already have an account? Login'}
          </p>
        </div>
      ) : (
        <>
          <h2>Post a Comment</h2>
          <textarea
            rows="3"
            placeholder="Write your comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          /><br /><br />
          <button onClick={postComment}>Post Comment</button>

          <h3>🧵 Thread</h3>
          {renderComments(comments)}

          <h3>🔔 Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map((n, idx) => (
              <p key={idx}>
                💬 <strong>{n.fromUsername || 'Someone'}</strong> replied to your comment (ID: {n.replyToCommentId})
              </p>
            ))
          ) : (
            <p>No new replies yet</p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
