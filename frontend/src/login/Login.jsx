import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';

const Login = () => {
  const [userData, setUserData] = useState({ username: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [recognitionRunning, setRecognitionRunning] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const navigate = useNavigate();

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1.2;
    utterance.voice = synthRef.current.getVoices().find(voice => voice.name.includes("Google UK English Female")) || synthRef.current.getVoices()[0];
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech Recognition not supported.');
      speakText('Sorry, your browser does not support voice input.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log(`Recognized speech: ${transcript}`);

      if (!currentField) {
        console.error("No active field selected.");
        return;
      }

      setUserData((prev) => ({
        ...prev,
        [currentField]: transcript,
      }));

      speakText(`You entered: ${transcript}`);
      setRecognitionRunning(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      speakText('Voice input failed. Please try again.');
      setRecognitionRunning(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleFieldFocus = async (field) => {
    if (recognitionRunning) {
      console.log("Recognition already running. Stopping first...");
      recognitionRef.current.stop(); 
      setRecognitionRunning(false);
      await new Promise(resolve => setTimeout(resolve, 500)); 
    }
  
    console.log(`Starting recognition for ${field}`);
    speakText(`Please say your ${field}`);
  
    setTimeout(() => {
      if (recognitionRef.current && !recognitionRunning) {
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.trim();
          console.log(`Recognized speech: ${transcript}`);
  
          setUserData((prev) => ({
            ...prev,
            [field]: transcript, 
          }));
  
          speakText(`You entered: ${transcript}`);
          setRecognitionRunning(false);
        };
  
        recognitionRef.current.start();
        setRecognitionRunning(true);
      }
    }, 500);
  };
  
  
  const handleMouseHover = (message) => {
    speakText(message);
  };

  const confirmDetails = () => {
    speakText(`You entered username: ${userData.username} and password:${userData.password} Press login to continue.`);
    
  };

  const loginUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
  
    try {
      const response = await axios.post("http://localhost:8082/login", userData);
      
      if (response.data.success && response.data.token) {
       
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user_id", response.data.user_id || "");
        localStorage.setItem("user", userData.username);
  
       
        speakText(`Welcome ${userData.username}.Our products`);
        
       
        setTimeout(() => {
          navigate("/products");
        }, 2500); 
        
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message);
      speakText(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageHeading} onMouseEnter={() => handleMouseHover("Welcome to EchoSavvy login page")}>Echosavvy</h1>
      
      <div className={styles.formContainer}>
        <h2 onMouseEnter={() => handleMouseHover("Login")}>Login</h2>
        
        <input
          type="text"
          required
          placeholder="Enter Your Username"
          value={userData.username}
          onFocus={() => handleFieldFocus('username')}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}
          onMouseEnter={() => handleMouseHover("Enter your username")}
          className={styles.userPhoneInput}
        />

        <input
          type="password"
          required
          placeholder="Enter Your Password"
          value={userData.password}
          onFocus={() => handleFieldFocus('password')}
          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
          onMouseEnter={() => handleMouseHover("Enter your password")}
          className={styles.userPasswordInput}
        />

        {errorMessage && <p className={styles.errorMessage} onMouseEnter={() => handleMouseHover(errorMessage)}>{errorMessage}</p>}

        <button
        className={styles.submitButton}
        onClick={(event) => {
      confirmDetails();
      
      loginUser(event);
  }}
  onFocus={() => handleMouseHover('Press this button to log in')}
  onMouseEnter={() => handleMouseHover("Click to login")}
  disabled={loading || !userData.username || !userData.password}
>
  {loading ? 'Logging in...' : 'Login'}
</button>


        <Link
          to="/signup"
          onFocus={() => handleMouseHover('Go to Signup Page')}
          onMouseEnter={() => handleMouseHover("Click here to sign up")}
        >
          <p className={styles.link}>Don't Have An Account? Signup now!</p>
        </Link>
      </div>
    </div>
  );
};

export default Login;
