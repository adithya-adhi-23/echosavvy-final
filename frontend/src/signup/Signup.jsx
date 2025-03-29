import React, { useState, useEffect, useRef } from 'react';
import styles from "./Signup.module.css";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [userData, setUserData] = useState({ username: '', phone: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [currentField, setCurrentField] = useState(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();


  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log(`Recognized speech: ${transcript}`);

        setUserData((prev) => ({
          ...prev,
          [currentField]: transcript
        }));

        if (transcript.toLowerCase() === 'submit') {
          registerUser();
        }

        speakText(`You entered: ${transcript}`);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        speakText('Error with voice input. Please try again.');
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech Recognition API is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentField]);

  
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
  
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Google UK English Female'));
  
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
  
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };
  
 
  const handleFieldFocus = (field, message) => {
    setCurrentField(field);

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setTimeout(() => recognitionRef.current.start(), 200);
    }

    speakText(message);
  };

  
  const handleMouseHover = (message) => {
    speakText(message);
  };

  const registerUser = async () => {
    console.log("📤 Sending signup request with data:", userData);

    const trimmedUserData = {
      username: userData.username.trim(),  
      phone: userData.phone.replace(/\s+/g, ''), 
      password: userData.password.replace(/\s+/g, '') 
    };

    console.log("🚀 Processed User Data:", JSON.stringify(trimmedUserData, null, 2));

    
    if (!trimmedUserData.username || !trimmedUserData.phone || !trimmedUserData.password) {
      console.error("❌ Missing Fields:", trimmedUserData);
      setErrorMessage('All fields are required.');
      speakText('All fields are required.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8082/signup', trimmedUserData, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("✅ Signup successful:", response.data);

      if (response.data.message === "User registered successfully") {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        speakText('Signup successful. Redirecting to products page.');
        navigate('/products');
      } else {
        setErrorMessage(response.data.message || 'Signup failed. Please try again.');
        speakText(response.data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Signup error:', error.response?.data || error);
      setErrorMessage(error.response?.data?.message || 'An error occurred while signing up. Please try again.');
      speakText(error.response?.data?.message || 'An error occurred while signing up. Please try again.');
    }
  };

  return (
    <div className={styles.mainContainer}>
      <h1 
  className={styles.pageHeading} 
  onMouseEnter={() => handleMouseHover('Welcome to Echosavvy sign up page.')}
>
  Echosavvy
</h1>


      <div className={styles.formContainer}>
        <h2>Signup</h2>

        <input
          type="text"
          required
          placeholder="Enter Your Username"
          value={userData.username}  // FIXED: Changed from name to username
          onFocus={() => handleFieldFocus('username', 'Enter your user name and speak now.')}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}  // FIXED: Changed 'name' to 'username'
          onMouseEnter={() => handleMouseHover('Enter your username.')}
          className={styles.userFullNameInput}
        />

        <input
          type="tel"
          required
          placeholder="Enter Your Phone Number"
          value={userData.phone}
          onFocus={() => handleFieldFocus('phone', 'Enter your phone number and speak now.')}
          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
          onMouseEnter={() => handleMouseHover('Enter your phone number.')}
          className={styles.userPhoneInput}
        />

        <input
          type="password"
          required
          placeholder="Enter Your Password"
          value={userData.password}
          onFocus={() => handleFieldFocus('password', 'Enter your password and speak now.')}
          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
          onMouseEnter={() => handleMouseHover('Enter your password.')}
          className={styles.userPasswordInput}
        />

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        <button
          className={styles.submitButton}
          onClick={registerUser}
          onFocus={() => handleMouseHover('Press this button to sign up.')}
          onMouseEnter={() => handleMouseHover('Press this button to sign up.')}
          onMouseLeave={() => synthRef.current.cancel()}
        >
          Signup
        </button>

        <Link
          to="/login"
          onFocus={() => handleMouseHover('Navigate to login page.')}
          onMouseEnter={() => handleMouseHover('Navigate to login page.')}
          onMouseLeave={() => synthRef.current.cancel()}
        >
          <p className={styles.link}>Already Have An Account? Login now!</p>
        </Link>
      </div>
    </div>
  );
};

export default Signup;