import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSbHZBeFx-kSho6O7Y3oS2pvFPbdeS7iA",
  authDomain: "hidef-tiger-cqvh5.firebaseapp.com",
  projectId: "hidef-tiger-cqvh5",
  storageBucket: "hidef-tiger-cqvh5.firebasestorage.app",
  messagingSenderId: "102250617457",
  appId: "1:102250617457:web:bf6e63199557def30359d0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {}, "ai-studio-yemeklistesivepl-3ee4ba2f-be77-4fa3-b954-ac991339b02f");
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.", error);
    }
  }
}
testConnection();
