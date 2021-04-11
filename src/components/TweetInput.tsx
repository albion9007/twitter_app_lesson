// hooksを取り扱うために、hooksのuseStateをimportしておく。
import React, { useState } from "react";
import styles from "./TweetInput.module.css";
import { storage, db, auth } from "../firebase";

// firebaseからタイムスタンプを取得するため、firebase/appを取得しておく。
import firebase from "firebase/app";

// reduxのステートにアクセスするために、useSelectorをimportする。
import { useSelector } from "react-redux";

// userSliceで作ったselectUserも使うため、importする。
import { selectUser } from "../features/userSlice";
import { Avatar, Button, IconButton } from "@material-ui/core";

// Tweetの画像を保存するためのアイコンをimportする。
import AddAPhotoIcon from "@material-ui/icons/AddAPhoto";
import { url } from "node:inspector";
// TweetInputコンポーネントにReactのFCの型をつける。
const TweetInput: React.FC = () => {
  // useSelectorを使い、reduxのステートからuserステートを取得する。
  // useSelectorでselectUserを呼んでreduxのストアからuserステートを取得して、
  // ローカルのuser変数に格納する。
  const user = useSelector(selectUser);

  // ユーザーがTweetのメッセージと、アップロードする画像をステートとして管理する。
  // Tweetの画像を初期値をnullにして、データ型を取りうる値として、Fileオブジェクトまたはnull型とする。
  const [tweetImage, setTweetImage] = useState<File | null>(null);

  // Tweetメッセージは通常のテキストの文字列になっている。
  const [tweetMsg, setTweetMsg] = useState("");

  // ユーザーが画像を選択した時に呼び出されるコールバック関数を定義。
  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 選択した画像ファイルは1つだけにするため、filesの配列の０番目の要素の画像データだけを取得する。
    if (e.target.files![0]) {
      // 選択した画像ファイルが存在する場合は、
      // setTweetImageでtweetImageに画像ファイルのオブジェクトを格納してステートを更新する。
      // "!"について、TSのNon-null assertion operatorの機能。
      // これはTSのコンパイラにe.target.files![0]はnullまたはundefinedでは無いと通知するもの。
      // 仮に"!"を削除すると、TSのコンパイラが"オブジェクトは 'null' である可能性があります。"とエラーを出す。
      // そして、これはindex0の要素にアクセス出来ないとエラーが出る。
      // onChangeImageHandlerに入る時は既に何らかのファイルが選択されている時のため、
      // この"!"Non-null assertion operatorをつけることで、コンパイラの方に
      // こちらはnullでは有りませんよと教えることで、エラーを解消している。
      setTweetImage(e.target.files![0]);

      // 格納が終わればe.target.valueで毎度初期化しておく。
      // これはHTMLのファイルダイアログになる。
      // これは連続してファイルを選択した時に、onchangeが反応しない仕様になっている。
      // これを毎回反応する様にするためには、e.target.valueを毎回初期化する必要がある。
      e.target.value = "";
    }
  };
  // "Tweet"ボタンが押された時に実行される関数を定義を作る。
  const sendTweet = (e: React.FormEvent<HTMLFormElement>) => {
    // formのonSubmitが時効された時に、ブラウザが自動でリフレッシュされる。
    // それを防ぐために、イベントオブジェクトのpreventDefaultを実行する。
    e.preventDefault();
    // 投稿するTweetのイメージが選択されている場合と、そうでない場合で処理を条件分けしていく。
    // ★ユーザーがメッセージのみ、メッセージ＋画像の場合だけ投稿出来る。画像だけでは投稿できない様にしていく。
    // メッセージ＋画像の場合、ユーザーが選択した画像をcloudのstorageに保存する。
    if (tweetImage) {
      const S =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

      // Nは生成したい16文字のランダムな文字列。
      const N = 16;

      // 最終的にrandomCharに、16桁のランダムな文字列が上記の62文字のリストから選ばれて生成されて入る。
      // getRandomValuesはjavascriptで乱数を生成してくれる機能。
      // Uint32（アンサインドイント32）は符号なしの32ビットと言う意味。これは0〜43億まで表現出来る。その数字の中から16個数字が選ばれる。
      const randomChar = Array.from(crypto.getRandomValues(new Uint32Array(N)))

        // 16個の要素が入った配列をmapで展開した各要素をnに格納している。
        // 43億の数字をSの文字列の長さの62で割った余りをindexとして取得している。
        // 上記のindexは必ず0〜61のどれかになる。なのでこれをランダムに文字列を16個選んでいる形になる。
        .map((n) => S[n % S.length])

        // 生成された文字列をjoinで結合してfileNameの先頭に"_"を足していくことで、
        // ユニークなfileNameを作ることが出来る。
        .join("");

      // これを使いfirebaseのstorageにアップロードしていくことが出来る。
      const fileName = randomChar + "_" + tweetImage.name;

      // Tweetの投稿imageは、imagesと言うフォルダに投稿データのファイルデータを保存していく。
      // putでファイルオブジェクトを指定していく。
      const uploadTweetImg = storage.ref(`images/${fileName}`).put(tweetImage);
      // 上記でuploadTweetImgに格納したstorage.refの返り値に、
      // onメソッドでstorageに対して何らかのステートの変化があった場合に処理を追加できる。
      // 3つ関数を足す事ができる。
      // 1つ目はアップロードの進捗を管理する事ができるもの。
      // 2つ目はエラーハンドリング。
      // 3つ目は正常終了した場合に実行される関数を足す事ができる。
      uploadTweetImg.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        // 今回は1つ目の進捗に関しては特に実装しないため、空の関数にしておく。
        () => {},
        // 2つ目のエラーハンドリング。何らかのエラーを検知した場合、
        // alertダイアログでエラーメッセージを出力しておく。
        (err) => {
          alert(err.message);
        },
        // 3つ目は正常終了した場合、storageにアップロードした画像のurlを取得していく。
        async () => {
          // awaitを使いstorageのrefのimagesの階層にデータを保存しているため、
          // そこにアクセスして参照したいファイルネームを指定する。
          await storage
            .ref("images")
            .child(fileName)
            // getDownloadURLで対象のファイルのurlのパスを取得する。
            .getDownloadURL()
            // パスの取得に成功したらそのurlリンクを使い、cloudのfirestoreの投稿データをアップロードしていく。
            .then(async (url) => {
              await db.collection("posts").add({
                avatar: user.photoUrl,
                // imageに今アップロードしたファイルのurlパスを指定して、firestoreに保存していく。
                image: url,
                text: tweetMsg,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                username: user.displayName,
              });
            });
        }
      );
      // tweetImageが無い場合はtextのみをデータベースに登録していく。
    } else {
      // データベースのcollectionと言うものがあり、この中にdocumentが何個か入っていく形になる。
      // ここではcollectionにpostsと言う名前を付けていく。
      // postsにdocumentとして新しい投稿のデータを追加するために、addメソッドを使っていく。
      // その引数に追加したいオブジェクトを足していく。
      db.collection("posts").add({
        // 投稿したavatar画像をuserの属性に割り当てる。
        avatar: user.photoUrl,
        // tweetImageが無いため、imageには空の文字列を代入しておく。
        image: "",
        // tweetのtextメッセージは、ステートのtweetMsgを割り当てていく。
        text: tweetMsg,
        // 投稿された日時をtimestampで管理していく。
        // 現在の日時はfirebaseのfirestoreの、FieldValueのserverTimestampで時刻を取得出来る。
        // それをtimestampに代入する。
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        // usernameは、ログインしているユーザーのdisplayNameを割り当てて、
        // firestoreに新しく追加できる様にしておく。
        username: user.displayName,
      });
    }
    // 投稿が終わった後に、tweetImageとtweetMsgをリセットしておく。
    setTweetImage(null);
    setTweetMsg("");
  };

  return (
    <>
      {/* onSubmitを使い、sendTweet関数を指定し、実行する。 */}
      <form onSubmit={sendTweet}>
        <div className={styles.tweet_form}>
          {/* ログインしているユーザーのアバター画像を表示させる。 */}
          <Avatar
            className={styles.tweet_avatar}
            // srcにreduxのストアから取ってきたユーザーステートの中にあるphotoUrl属性を割り当てることで、
            // ログインしているユーザーのアバター画像を表示させる。
            src={user.photoUrl}
            // クリックした時にauthのsignOutを呼ぶことで、ログアウト出来る様になっている。
            onClick={async () => {
              await auth.signOut();
            }}
          />
          <input
            className={styles.tweet_input}
            placeholder="What's happening?"
            type="text"
            autoFocus
            // valueにテキストメッセージのtweetMsgステートを割り当てる。
            value={tweetMsg}
            // onChangeで毎回setTweetMsgが呼び出される様にする。
            onChange={(e) => setTweetMsg(e.target.value)}
          />
          {/* IconButtonをクリックすると、fileダイアログが立ち上がる。 */}
          <IconButton>
            <label>
              <AddAPhotoIcon
                // tweetImageが存在するかしないかで、styleわけを行う。
                className={
                  tweetImage ? styles.tweet_addIconLoaded : styles.tweet_addIcon
                }
              />
              {/* fileダイアログが立ち上がるためのinputフォームを作る */}
              <input
                className={styles.tweet_hiddenIcon}
                type="file"
                // fileが選択されれば、onChangeでonChangeImageHandlerが呼び出され実行される。
                // onChangeImageHandlerでは上記に有るように、
                // tweetImageに選択したimageオブジェクトが代入されるようになっている。
                onChange={onChangeImageHandler}
              />
            </label>
          </IconButton>
        </div>
        {/* Tweet用の送信ボタンを作る。 */}
        <Button
          type="submit"
          // disabledでtweetMsgが空の時にボタンを無効化する様に設定する。
          disabled={!tweetMsg}
          className={
            // tweetMsgが空の場合とそうで無い場合で、cssのボタンの色を分けるようにする。
            tweetMsg ? styles.tweet_sendBtn : styles.tweet_sendDisableBtn
          }
        >
          Tweet
        </Button>
      </form>
    </>
  );
};

export default TweetInput;
