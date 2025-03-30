import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TiShoppingCart } from "react-icons/ti";
import { HiMicrophone } from "react-icons/hi2";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { MdOutlineHome } from "react-icons/md";
import styles from "./Products.module.css";
import axios from "axios";
import products from "../data/products";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isListening, setIsListening] = useState(false);
  const [user_id, setUserId] = useState(localStorage.getItem("user_id"));
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const productsContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-IN";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
    } else {
      console.warn("Speech recognition not supported.");
    }

    synthRef.current.onvoiceschanged = () => synthRef.current.getVoices();

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (searchTerm && filteredProducts.length > 0) {
      setTimeout(() => {
        if (productsContainerRef.current) {
          productsContainerRef.current.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
        speakText(`Found ${filteredProducts.length} matching products.`);
      }, 100);
    }
  }, [filteredProducts, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("guestCart");
    navigate("/login");
  };

  const handleSpeechResult = (event) => {
    const transcript = event.results[0][0].transcript;
    setSearchTerm(transcript);
    handleSearch({ target: { value: transcript } });
    setIsListening(false);
  };

  const handleSpeechError = () => {
    setIsListening(false);
    speakText("Sorry, I couldn't understand you. Please try again.");
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      synthRef.current.cancel();
      recognitionRef.current.start();
      setIsListening(true);
      speakText("Listening...");
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1.2;
    synthRef.current.speak(utterance);
  };

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = value ? products.filter(p => p.name.toLowerCase().includes(value)) : products;
    setFilteredProducts(filtered);
    
    if (value && filtered.length === 0) {
      speakText("No products found matching your search.");
    }
  };

  const handleAddToCart = async (product) => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");
  
    if (!userId || !token) {
      speakText("Please log in to add items to the cart.");
      return;
    }
  
    const cleanPrice = Number(String(product.price).replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(cleanPrice)) {
      speakText(`Invalid price format for ${product.name}`);
      return;
    }
  
    try {
      speakText(`Adding ${product.name} to cart...`);
      const response = await axios.post(
        "http://localhost:8082/api/cart/add",
        {
          user_id: userId,
          product_id: product.id,
          product_name: product.name,
          price: cleanPrice,
          quantity: 1,
          image_url: product.image
        },
        { 
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          } 
        }
      );
  
      if (response.status === 200) {
        speakText(`${product.name} added successfully!`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      speakText("Failed to add to cart. Please try again.");
    }
  };

  return (
    <main className={styles.productDisplay}>
      <div className={styles.topBar}>
        <h1 
          className={styles.platformName} 
          onMouseEnter={() => speakText("Welcome to EchoSavvy products page")}
          onFocus={() => speakText("EchoSavvy products page")}
        >
          Echosavvy
        </h1>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search products..."
            className={styles.searchBar}
            value={searchTerm}
            onChange={handleSearch}
            aria-label="Search products by name"
            onMouseEnter={() => speakText("Search bar. Type or use voice search")}
            onFocus={() => speakText("Search products")}
            onMouseLeave={stopSpeech}
          />

          <HiMicrophone
            className={styles.microphoneIcon}
            size={20}
            onClick={startVoiceSearch}
            onKeyDown={(e) => { 
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startVoiceSearch();
              }
            }}
            tabIndex={0}
            aria-label="Start voice search"
            onMouseEnter={() => speakText("Voice search button")}
            onMouseLeave={stopSpeech}
          />
        </div>

        <div className={styles.userControls}>
          <Link 
            to="/cart" 
            className={styles.cartButton}
            onMouseEnter={() => speakText("Cart, press to view")}
            onFocus={() => speakText("Go to cart")}
            onMouseLeave={stopSpeech}
          >
            <TiShoppingCart size={24} aria-hidden="true" /> 
            <span>Cart</span>
          </Link>
          
          {!user_id ? (
            <Link 
              to="/" 
              className={styles.homeButton}
              onMouseEnter={() => speakText("Home, press to return")}
              onFocus={() => speakText("Go to home page")}
              onMouseLeave={stopSpeech}
            >
              <MdOutlineHome size={20} aria-hidden="true" />
              <span>Home</span>
            </Link>
          ) : (
            <button 
              className={styles.logoutButton} 
              onClick={handleLogout}
              onMouseEnter={() => speakText("Logout button")}
              onFocus={() => speakText("Press to logout")}
              onMouseLeave={stopSpeech}
            >
              <RiLogoutBoxRLine size={18} aria-hidden="true" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      <div 
        className={styles.productsDisp} 
        ref={productsContainerRef}
      >
        <div className={styles.productGrid}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={styles.productCard}
                tabIndex={0}
                onFocus={() => speakText(`${product.name}, ${product.price}`)}
                onMouseEnter={() => speakText(`${product.name}, ${product.price}`)}
                onMouseLeave={stopSpeech}
              >
                <img 
                  src={product.image} 
                  alt="" 
                  className={styles.productImage}
                  aria-hidden="true"
                />
                <h3>{product.name}</h3>
                <p className={styles.category} aria-hidden="true">
                  Category: {product.category}
                </p>
                <p className={styles.price}>₹{product.price}</p>
                <button
                  className={styles.addToCart}
                  onClick={() => handleAddToCart(product)}
                  onMouseEnter={() => speakText(`Add ${product.name} to cart`)}
                  onFocus={() => speakText(`Add to cart button for ${product.name}`)}
                  onMouseLeave={stopSpeech}
                  aria-label={`Add ${product.name} to cart`}
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p 
              className={styles.noResults}
              aria-live="polite"
              onMouseEnter={() => speakText("No products found")}
              onFocus={() => speakText("No matching products found")}
            >
              No products found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;