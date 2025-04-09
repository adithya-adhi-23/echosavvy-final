import React, { useEffect, useState } from 'react';
import styles from './Checkout.module.css';
import { speakText, stopSpeech } from './speechUtilis';

const Checkout = () => {
  const [activePayment, setActivePayment] = useState(null);
  const [step, setStep] = useState(1);

  const paymentMethods = [
    {
      id: 'voice-pin',
      name: 'Voice Authentication',
      description: 'Confirm payment using your voice PIN',
      icon: '🗣️',
      instructions: 'After selecting, you will be prompted to say your 6-digit voice PIN'
    },
    {
      id: 'otp-call',
      name: 'OTP via Phone Call',
      description: 'Receive OTP through an automated phone call',
      icon: '📞',
      instructions: 'We will call your registered number with the verification code'
    },
    {
      id: 'tactile-card',
      name: 'Tactile Card Reader',
      description: 'For users with tactile payment cards',
      icon: '🖐️',
      instructions: 'Insert your card into the accessible reader when prompted'
    }
  ];

  const announce = (message, priority = 'polite') => {
    speakText(message, true); 

    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.innerText = message;

      setTimeout(() => {
        liveRegion.innerText = '';
      }, 2000);
    }
  };

  useEffect(() => {
    announce('Checkout page loaded. Please select your preferred payment method.');

    return () => stopSpeech();
  }, []);

  const handlePaymentSelect = (method) => {
    setActivePayment(method);
    announce(`Selected ${method.name}. ${method.instructions}. Press the confirm button to proceed.`);
  };

  const handleConfirm = () => {
    if (!activePayment) {
      announce('Please select a payment method first.', 'assertive');
      return;
    }
    setStep(2);
    announce(`You have selected ${activePayment.name}. Preparing your payment. Please wait.`);

    setTimeout(() => {
      announce(`Payment with ${activePayment.name} is being processed. You will receive confirmation shortly.`);
    }, 3000);
  };

  return (
    <div className={styles.checkoutContainer}>
      <div id="a11y-live-region" aria-live="polite" className={styles.hidden}></div>

      <h1 className={styles.pageTitle} aria-label="Checkout">Checkout</h1>

      {step === 1 ? (
        <>
          <div className={styles.paymentMethods}>
            <h2 className={styles.sectionTitle}>Select Payment Method</h2>
            {paymentMethods.map(method => (
              <div 
                key={method.id}
                className={`${styles.paymentCard} ${activePayment?.id === method.id ? styles.active : ''}`}
                onClick={() => handlePaymentSelect(method)}
                onKeyDown={(e) => e.key === 'Enter' && handlePaymentSelect(method)}
                onMouseEnter={() => speakText(`${method.name}. ${method.description}`)}
                onFocus={() => speakText(`${method.name}. ${method.description}`)}
                tabIndex="0"
                role="button"
              >
                <span className={styles.paymentIcon} aria-hidden="true">{method.icon}</span>
                <div className={styles.paymentDetails}>
                  <h3>{method.name}</h3>
                  <p>{method.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            className={styles.confirmButton}
            onClick={handleConfirm}
            onMouseEnter={() => speakText("Confirm payment method")}
            onFocus={() => speakText("Confirm payment method")}
            aria-label="Confirm payment method"
          >
            Confirm Payment Method
          </button>
        </>
      ) : (
        <div className={styles.confirmationScreen}>
          <div className={styles.progressIndicator} aria-hidden="true">
            <div className={styles.progressBar}></div>
          </div>
          
          <h2 className={styles.sectionTitle}>Processing Your Payment</h2>
          {activePayment && (
            <p className={styles.paymentMethodInfo}>
              Using: {activePayment.name} ({activePayment.description})
            </p>
          )}

          {activePayment && (
            <div className={styles.instructions}>
              <h3>Next Steps:</h3>
              <p>{activePayment.instructions}</p>
            </div>
          )}

          <div className={styles.tactileFeedback} aria-hidden="true">
            <div className={styles.vibrationPattern}></div>
            <div className={styles.vibrationPattern}></div>
            <div className={styles.vibrationPattern}></div>
          </div>

          <button 
            className={styles.cancelButton}
            onClick={() => setStep(1)}
            onMouseEnter={() => speakText("Change Payment Method")}
            onFocus={() => speakText("Change Payment Method")}
            aria-label="Go back to payment selection"
          >
            Change Payment Method
          </button>
        </div>
      )}

      <div className={styles.accessibilityFeatures}>
        <button 
          className={styles.accessibilityButton}
          onClick={() => announce(
            step === 1
              ? `Select payment method. Options available: ${paymentMethods.map(m => m.name).join(', ')}`
              : `Processing with ${activePayment?.name}. ${activePayment?.instructions}`
          )}
          onMouseEnter={() => speakText("Click to repeat instructions")}
          onFocus={() => speakText("Click to repeat instructions")}
          aria-label="Repeat current status"
        >
          Repeat Instructions
        </button>
        <button 
          className={styles.accessibilityButton}
          onClick={stopSpeech}
          onMouseEnter={() => speakText("Click to stop speech")}
          onFocus={() => speakText("Click to stop speech")}
          aria-label="Stop speech"
        >
          Stop Speech
        </button>
      </div>
    </div>
  );
};

export default Checkout;
