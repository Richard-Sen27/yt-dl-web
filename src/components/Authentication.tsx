import React, { useState, useEffect } from 'react';

interface AuthenticationProps {
  onAuthChange: (cookies: string) => void;
}

export default function Authentication({ onAuthChange }: AuthenticationProps) {
  const [cookies, setCookies] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Load cookies from localStorage on component mount
    const savedCookies = localStorage.getItem('youtube-cookies');
    if (savedCookies) {
      setCookies(savedCookies);
      setIsLoggedIn(true);
      onAuthChange(savedCookies);
    }
  }, []);

  const handleLogin = () => {
    if (!cookies.trim()) {
      alert('Please enter your YouTube cookies');
      return;
    }

    // Save to localStorage
    localStorage.setItem('youtube-cookies', cookies);
    setIsLoggedIn(true);
    onAuthChange(cookies);
  };

  const handleLogout = () => {
    localStorage.removeItem('youtube-cookies');
    setCookies('');
    setIsLoggedIn(false);
    onAuthChange('');
  };

  const handleCookiesChange = (value: string) => {
    setCookies(value);
  };

  return (
    <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        YouTube Authentication (Optional)
      </h3>
      
      {!isLoggedIn ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            To avoid bot detection and access age-restricted content, you can provide your YouTube cookies:
          </p>
          
          <div className="space-y-2">
            <label htmlFor="cookies" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              YouTube Cookies:
            </label>
            <textarea
              id="cookies"
              value={cookies}
              onChange={(e) => handleCookiesChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Paste your YouTube cookies here (e.g., session_token=...; VISITOR_INFO1_LIVE=...)"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md 
                hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login with Cookies
            </button>
            
            <button
              type="button"
              onClick={() => window.open('https://www.youtube.com', '_blank')}
              className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md 
                hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Open YouTube
            </button>
          </div>
          
          <details className="text-sm text-gray-600 dark:text-gray-400">
            <summary className="cursor-pointer font-medium">How to get YouTube cookies?</summary>
            <div className="mt-2 pl-4 space-y-1">
              <p>1. Open YouTube in your browser and log in</p>
              <p>2. Open Developer Tools (F12)</p>
              <p>3. Go to Application/Storage → Cookies → https://www.youtube.com</p>
              <p>4. Copy the cookie values (especially session_token, VISITOR_INFO1_LIVE)</p>
              <p>5. Paste them here in the format: name1=value1; name2=value2;</p>
            </div>
          </details>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-700 dark:text-green-400 font-medium">Authenticated with YouTube</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-md 
              hover:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
