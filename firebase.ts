// 1. Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// 2. Your web app's Firebase configuration
// ** مهم جداً: استبدل هذه القيم بالقيم الخاصة بمشروعك على Firebase **
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:XXXXXXXXXXXXXXXXXXXXXX"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Get references to the services you need
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
