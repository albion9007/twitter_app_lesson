// hooksのuseEffectを使うため、importする。
import React, { useEffect } from "react";
import styles from "./App.module.css";

// reduxのステートにuseSelectorでステートにアクセスする事と、
// dispatchを使ってloginとlogoutをAppコンポーネントから呼び出すため、
// useSelector, useDispatchをimportする。
import { useSelector, useDispatch } from "react-redux";
import { selectUser, login, logout } from "./features/userSlice";
import { auth } from "./firebase";
import Feed from "./components/Feed";
import Auth from "./components/Auth";

// typescriptではあらかじめreactのfunctionalコンポーネントに対する型が決められているため、App: React.FCとする。
const App: React.FC = () => {
  // Appコンポーネントからreduxの中のuserステートを参照する。上記で定義したselectUserを実行して、
  // reduxのステートの中からユーザーのステートを取得して、user変数に代入する。
  // こうすることで、Appコンポーネントからreduxのストアの中のユーザーステートを取得することが出来る。
  const user = useSelector(selectUser);

  // loginとlogoutをdispatchするために、useDispatchでdispatchを作る。
  const dispatch = useDispatch();

  // hooksのuseEffectを使い、
  // firebaseのauthの中に準備されているonAuthStateChangedを実行する。
  // これはfirebaseのユーザーに対して何らかの変化が有った時に、毎回呼び出される関数。
  // 例えば新しくユーザーがログインした時や、ログアウトした時、ユーザーが変わった時など。
  // この関数を実行すると、サブスクライブが始まりユーザーの変化の監視を始める。
  // onAuthStateChanged関数の返り値として、unSubするための返り値として返してくれるため、
  // unSubを定義しておく。
  useEffect(() => {
    // 引数に変化後のユーザーの情報が入るため、authUserに格納しておく。
    const unSub = auth.onAuthStateChanged((authUser) => {
      // authUserが存在するとき、userSliceで作ったloginのレデューサーをdispatch経由で実行、
      // payloadのアクションでfirebaseで取得したauthUserの情報をpayloadで渡す。
      // reduxのユーザーステートの内容に情報をアップデートする様にしていく。
      if (authUser) {
        // dispatchでloginのアクションを実行する。
        // 引数にアクションのpayloadを渡すことが出来るため、
        // それぞれfirebaseからユーザー属性の中のパラメーターを割り当てる。
        dispatch(
          login({
            uid: authUser.uid,
            photoUrl: authUser.photoURL,
            displayName: authUser.displayName,
          })
        );

        // authUserが存在しない場合は、dispatchを使いlogoutを実行していく。
        // logoutが実行された場合は、reduxで管理していたユーザーのステートの内容がリセットされ空の文字列が代入される。
      } else {
        dispatch(logout());
      }
    });

    // useEffectではクリーンアップ関数を指定することが出来る。
    // クリーンアップ関数はこのAppコンポーネントがアンマウントされた時に実行される関数のこと。
    // ここでは、サブスクリプションを開始してAppコンポーネントがアンマウントされた後は、
    // サブスクリプションをする必要がない。そのため、unSubをクリーンアップで実行する様にしておく。
    return () => {
      unSub();
    };
  }, [dispatch]);

  return (
    <>
      {/* userが存在しているときと、していない時で条件分岐をする。 */}
      {user.uid ? (
        <div className={styles.app}>
          {/* userが存在している場合は、Feedコンポーネントに飛ぶ様にする。 */}
          <Feed />
        </div>
      ) : (
        // userが存在しない場合はAuthコンポーネントに飛ぶ様にする。
        <Auth />
      )}
    </>
  );
};

export default App;
