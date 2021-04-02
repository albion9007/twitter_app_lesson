import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firebase-firestore";
import "firebase/firebase-storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_APIKEY,
  authDomain: process.env.REACT_APP_FIREBASE_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// firebaseを初期化するために、firebase.initializeAppとし、
// 引数に上記で環境変数で定義したパラメータを渡すことで、初期化される。
const firebaseApp = firebase.initializeApp(firebaseConfig);

// 他のコンポーネントでも上記のパラメータが使える様にexportしておく。
export const db = firebaseApp.firestore();
export const auth = firebaseApp.auth();
export const storage = firebaseApp.storage();

// Googleの認証機能を使うため、providerをGoogleAuthProviderを用いて定義し、
// 他コンポーネントで利用出来るようにしておく。
export const provider = new firebase.auth.GoogleAuthProvider();
