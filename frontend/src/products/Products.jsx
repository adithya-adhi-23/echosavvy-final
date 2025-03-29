import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TiShoppingCart } from "react-icons/ti";
import { HiMicrophone } from "react-icons/hi2";
import { RiLogoutBoxRLine } from "react-icons/ri";
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
    setFilteredProducts(value ? products.filter(p => p.name.toLowerCase().includes(value)) : products);
  };

 
  
  
  const handleAddToCart = async (product) => {
    const userId = localStorage.getItem("user_id");
    const token = localStorage.getItem("token");
  
    if (!userId || !token) {
      alert("Please log in to add items to the cart.");
      return;
    }
  
    // Clean and validate price (handles ₹500, "500", etc.)
    const cleanPrice = Number(String(product.price).replace(/[^0-9.-]+/g, ""));
    
    if (isNaN(cleanPrice)) {
      alert(`Invalid price format: ${product.price}`);
      return;
    }
  
    try {
      const response = await axios.post(
        "http://localhost:8082/api/cart/add",
        {
          user_id: userId,
          product_id: product.id,
          product_name: product.name,
          price: cleanPrice,  // Use cleaned price
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
        alert("Product added to cart successfully!");
        navigate("/cart");
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert("Failed to add to cart. See console for details.");
    }
  };
  return (
    <main className={styles.productDisplay}>
      <div className={styles.topBar}>
        <h1 className={styles.platformName} onMouseEnter={() => speakText("Welcome to EchoSavvy products page")}>
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
            onMouseEnter={() => speakText("Search bar for products search")}
            onMouseLeave={stopSpeech}
          />

          <HiMicrophone
            className={styles.microphoneIcon}
            size={20}
            onClick={startVoiceSearch}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") startVoiceSearch(); }}
            tabIndex={0}
            aria-label="Start voice search"
            onMouseEnter={() => speakText("Click here to search products")}
            onMouseLeave={stopSpeech}
          />
        </div>

        {user_id ? (
          <div className={styles.userControls}>
            <Link to={`/cart`} className={styles.cartButton}>
              <TiShoppingCart size={24} /> Cart
            </Link>
            <button 
              className={styles.logoutButton} 
              onClick={handleLogout}
              onMouseEnter={() => speakText("Logout")}
              onMouseLeave={stopSpeech}
            >
              <RiLogoutBoxRLine size={20} /> Logout
            </button>
          </div>
        ) : (
          <Link to="/cart" className={styles.cartButton} onMouseEnter={() => speakText("CLICK TO CART")}>
            <TiShoppingCart size={24} /> Cart
          </Link>
        )}
      </div>

      <div className={styles.productsDisp}>
        <div className={styles.productGrid} onMouseLeave={stopSpeech}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={styles.productCard}
                onMouseEnter={() => speakText(`${product.name}, Price: ${product.price}, Category: ${product.category}, Description: ${product.description}`)}
                onMouseLeave={stopSpeech}
              >
                <img src={product.image} alt={product.name} className={styles.productImage} />
                <h3>{product.name}</h3>
                <p className={styles.category}>Category: {product.category}</p>
                <p className={styles.price}>₹{product.price}</p>
                <button
                  className={styles.addToCart}
                  onClick={() => handleAddToCart(product)}
                  onMouseEnter={() => speakText("Add to cart")}
                  onMouseLeave={stopSpeech}
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p className={styles.noResults} aria-live="polite" onMouseEnter={() => speakText("Sorry, no products found.")}>
              No products found.
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;