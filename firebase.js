import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, increment,
  arrayUnion, Timestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig={
  apiKey:"AIzaSyBaFCtwh4OD9ymK2ZOhwCELjJyWSqkHCGQ",
  authDomain:"afrivest-7e5e9.firebaseapp.com",
  projectId:"afrivest-7e5e9",
  storageBucket:"afrivest-7e5e9.firebasestorage.app",
  messagingSenderId:"523778500193",
  appId:"1:523778500193:web:d402d48b1ea30da8952c20",
  measurementId:"G-9CVP0XMM6L"
};
const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
export {db,collection,doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,onSnapshot,query,where,orderBy,limit,addDoc,serverTimestamp,increment,arrayUnion,Timestamp,runTransaction};
