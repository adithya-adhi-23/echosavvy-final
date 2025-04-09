import { Link } from "react-router-dom";
import styles from './EmptyCart.module.css';
import { speakText } from "./speechUtils";
import { DotLottieReact } from "@lottiefiles/dotlottie-react"; // ✅ Correct import

const EmptyCart = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.animation}>
          <DotLottieReact
            src="https://lottie.host/0c4ca11d-ab38-4ff9-85f4-ba331970e861/slMmUBA4Rs.lottie"
            autoplay
            loop
          />
        </div>
        <h2 onMouseEnter={() => speakText('Missing Cart items ?')}>Missing Cart Items ?</h2>
        <p onMouseEnter={() => speakText('Login to see the items you added previously')}>
          Login to see the items you added previously
        </p>
        <div className={styles.buttons}>
          <Link
            to="/login"
            className={styles.loginButton}
            onMouseEnter={() => speakText('click to login now')}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;
