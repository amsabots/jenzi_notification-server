import { initializeApp } from "firebase/app";
import { ref, set, getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyDJeD_BkJ9_CjVnAb7vieYDzgUA-cbL3SA",
  authDomain: "jenzi-1234d.firebaseapp.com",
  databaseURL:
    "https://jenzi-1234d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jenzi-1234d",
  storageBucket: "jenzi-1234d.appspot.com",
  messagingSenderId: "767171095114",
  appId: "1:767171095114:web:2c1a414d7b02ab4a8154b3",
  measurementId: "G-9K2BR1FFXQ",
};

const app = initializeApp(firebaseConfig);
export const firebase_db = getDatabase(app);
