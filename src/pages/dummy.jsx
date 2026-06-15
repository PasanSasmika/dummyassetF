// import React, { useState } from 'react';

// function Dummy() {
//   // States for your input fields
//   const [email, setEmail] = useState('admin@admin.com');
//   const [password, setPassword] = useState('admin');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleAdminLogin = async (e) => {
//     e.preventDefault(); 
//     setLoading(true);
//     setError('');
    
//     try {
//       const response = await fetch('http://localhost:5000/api/auth/admin-login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         // 1. Save token AND the user object to localStorage so Redux can find it
//         localStorage.setItem('token', data.token);
//         localStorage.setItem('user', JSON.stringify(data.data)); 
        
//         // 2. Hard redirect to dashboard. This reloads the app and initializes your authSlice with the logged-in user!
//         window.location.href = '/dashboard';
//       } else {
//         setError(data.message || 'Login failed');
//       }
//     } catch (err) {
//       setError('Server connection error. Is the backend running?');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
//       <h2>Hardcoded Admin Login</h2>
      
//       {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
      
//       <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '15px' }}>
        
//         <input 
//           type="email" 
//           placeholder="Email" 
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//           style={{ padding: '10px', fontSize: '16px' }}
//         />
        
//         <input 
//           type="password" 
//           placeholder="Password" 
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           style={{ padding: '10px', fontSize: '16px' }}
//         />

//         <button 
//           type="submit" 
//           disabled={loading}
//           style={{ 
//             padding: '10px', fontSize: '16px', cursor: 'pointer', 
//             backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' 
//           }}
//         >
//           {loading ? 'Logging in...' : 'Login to Dashboard'}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Dummy;