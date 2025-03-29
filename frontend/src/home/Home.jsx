import React, { useEffect, useRef } from 'react';
import styles from "./Home.module.css";
import { Link } from 'react-router-dom';
import homeimg from "./home.webp";
import { AiOutlineLogin } from "react-icons/ai";

const Home = () => {
  const elementsRef = useRef([]);

  // Speech synthesis function with slower speed for Indian users
  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);

    // Set properties for better understanding (slower, natural pitch)
    utterance.lang = 'en-IN';  // Indian English
    utterance.rate = 0.85;      // Slower for better understanding
    utterance.pitch = 1.0;      // Natural pitch

    // Fetch available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Prefer an Indian English female voice
    const indianVoice = voices.find(voice =>
      voice.name.includes('Indian') || voice.lang === 'en-IN'
    );

    if (indianVoice) {
      utterance.voice = indianVoice;
    } else if (voices.length > 0) {
      utterance.voice = voices[0]; 
    }

    window.speechSynthesis.speak(utterance);
  };

 
  const handleFocus = (index) => {
    const element = elementsRef.current[index];
    if (element) {
      const text = element.getAttribute('aria-label') || element.textContent || '';
      speakText(text.trim());
    }
  };


  const handleMouseEnter = (event) => {
    const text = event.target.getAttribute('aria-label') || event.target.textContent || '';
    speakText(text.trim());
  };

  useEffect(() => {
    speakText("Welcome to EchoSavvy! An accessible e-commerce platform for visually impaired users. Move your cursor to the right top for login");
    
    elementsRef.current = Array.from(document.querySelectorAll('[data-focusable="true"]'));
    
    elementsRef.current.forEach((element, index) => {
      element.addEventListener('focus', () => handleFocus(index));
      element.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      elementsRef.current.forEach((element, index) => {
        element.removeEventListener('focus', () => handleFocus(index));
        element.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, []);


  return (
    <div>
      <h1 
        className={styles.heading} 
        tabIndex="0" 
        data-focusable="true" 
        aria-label="EchoSavvy: Home Page"
      >
        EchoSavvy
      </h1>

      <Link to="/login">
        <button
          className={styles.login}
          tabIndex="0"
          data-focusable="true"
          aria-label="Login Button. Click to navigate to the login page."
        >
          <AiOutlineLogin />
          Login
        </button>
      </Link>

      <div className={styles.content}>
        <p
          className={styles.welcome}
          tabIndex="0"
          data-focusable="true"
          aria-label="Welcome to EchoSavvy! We are an e-commerce platform designed to empower and assist visually impaired users. Our platform prioritizes accessibility, usability, and inclusivity to ensure a seamless shopping experience for everyone."
        >
          Welcome to EchoSavvy! We are an e-commerce platform designed to empower and assist visually impaired users. Our platform prioritizes accessibility, usability, and inclusivity to ensure a seamless shopping experience for everyone.
        </p>
        
        <img
          className={styles.homeimg}
          src={homeimg}
          alt="EchoSavvy logo"
          tabIndex="0"
          data-focusable="true"
          aria-label="EchoSavvy homepage illustration."
        />
      </div>

      <div className={styles.session}>
        <p 
          className={styles.copy} 
          tabIndex="0" 
          data-focusable="true" 
          aria-label="Copyright 2025 EchoSavvy. All rights reserved."
        >
          &copy; 2025 EchoSavvy. All rights reserved.
        </p>
        
        <p 
          className={styles.support} 
          tabIndex="0" 
          data-focusable="true" 
          aria-label="For support, contact echosavvy@gmail.com"
        >
          For support: echosavvy@gmail.com
        </p>
      </div>
    </div>
  );
};

export default Home;
