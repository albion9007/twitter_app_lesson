import React, { useState, useEffect } from "react";
import styles from "./Post.module.css";
import { db } from "../firebase";
import firebase from "firebase/app";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { Avatar } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import MessageIcon from "@material-ui/icons/Message";
import SendIcon from "@material-ui/icons/Send";

// Feedコンポーネントから各属性をもらうためには、TSではPROPSのデータ型で定義する。
// オブジェクトのデータ型はinterfaceを使って、新しくPROPSと言う名前のデータ型を作る。
interface PROPS {
  postId: string;
  avatar: string;
  image: string;
  text: string;
  timestamp: any;
  username: string;
}

// firestoreにアップロードしたコメントデータをreactから呼び出していくる。
// コメントオブジェクトのデータ型はinterfaceを使って、新しくCOMMENTと言う名前のデータ型を定義する。
interface COMMENT {
  id: string;
  avatar: string;
  text: string;
  timestamp: any;
  username: string;
}

// マテリアルuiの公式HPのAvatarのsizesからスタイルをとってくる。
const useStyles = makeStyles((theme) => ({
  small: {
    width: theme.spacing(3),
    height: theme.spacing(3),
    marginRight: theme.spacing(1),
  },
}));

// Postコンポーネントの引数にpropsを追加する。
const Post: React.FC<PROPS> = (props) => {
  // 上記で定義したuseStylesを使えるようにするためには、FC内でuseStylesを実行するclassesを定義する。
  const classes = useStyles();
  // useSelectorを使い、redux-storeからuserステートを取得する。
  const user = useSelector(selectUser);
  const [comment, setComment] = useState("");

  // firebaseから取得したコメントの一覧を配列の形でreactのステートとして保持する。
  // そのために、useStateを使いcommentsステートを定義していく。
  // useStateのデータ型にCOMMENT型を割り当て、さらに配列の形で取り扱うため、配列型にもしておく。
  const [comments, setComments] = useState<COMMENT[]>([
    // 初期値として空の文字列やnullを割り当てる。
    {
      id: "",
      avatar: "",
      text: "",
      username: "",
      timestamp: null,
    },
  ]);
  // コメントを表示、非表示させるアイコンを作っていく。
  // そのアイコンを押した時だけコメントが表示される様にする。
  // useStateでopenCommentsがtrue,falseを保持する様にしていく。
  const [openComments, setOpenComments] = useState(false);
  // useEffectが実行された時に、
  // cloudのfirestoreから対象の投稿のコメントの一覧を全て取得して、
  // 上記のcommentsの中に代入することができる。
  useEffect(() => {
    // dbのcollectionのpostsにアクセスする。
    const unSub = db
      .collection("posts")
      // 対象になっている投稿のidを基に、投稿のdocにアクセスする。
      .doc(props.postId)
      // 上記docに入っているcommentsのcollectionにアクセスする。
      .collection("comments")
      // commentsの内容を全て取得し、それをtimestampの新しい順にcommentsのオブジェクトを取得する。
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
        // commentsのオブジェクトをsetCommentsを使ってreactのcommentsのステートに格納していく。
        setComments(
          // docの内容（コメント）をmapで1つ1つ展開していく。
          // それぞれに属性を上記のuseStateで定義したcommentsの内容を当てはめていく。
          snapshot.docs.map((doc) => ({
            // firestoreのdocのidを取得する。
            id: doc.id,
            // その他のフィールドの値はdoc.data().属性名で取得出来る。
            avatar: doc.data().avatar,
            text: doc.data().text,
            username: doc.data().username,
            timestamp: doc.data().timestamp,
          }))
        );
      });
    // コンポーネントがアンマウントされた時のcleanUp関数にunSub関数を実行する様にしている。
    return () => {
      unSub();
    };
    // useEffectの第2引数にpropsで受け取っているpostId（投稿のid）を指定することで、
    // 投稿が違う投稿になった場合は再度useEffectの処理を実効する様にしている。
  }, [props.postId]);

  const newComment = (e: React.FormEvent<HTMLFormElement>) => {
    // onsubmitでnewComment関数を使うため、リフレッシュを防ぐため、e.preventDefault();を追記する。
    e.preventDefault();
    // dbのcollectionを使い、新規のコメントをアップデートしていく。
    // コメントは各投稿にされるものなので、各コメントに紐づいていなければならない。
    // そのため、dbを入子構造にしていく。
    // postsのcollectionの中にある、どの投稿に関してコメントを投稿するかを指定する。
    // docの引数でprops.postIdを取得して、対象になっている投稿のIDを指定する、
    // また、その指定した投稿の中にcollectionを使う、この時のcollectionの名前をcommentsにする。
    // このcommentscollectionに複数のコメントがドキュメントとして保存される様にする。
    db.collection("posts").doc(props.postId).collection("comments").add({
      // addを使い、その中に追加したいオブジェクトを定義していく。
      // 上記のuserステートのphotoUrl属性を取得する。そしてdbにアップデートしていく。
      avatar: user.photoUrl,
      // text属性にユーザーのコメントをアップデートしていく。
      text: comment,
      // timestampとして、firebaseのその時の時間を取得して、dbに登録していく。
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      // コメントをしたユーザーの名前が現在のログインしているユーザーの名前に当たるため、
      // reduxのストアの中のuserステートのdisplayNameを割り当てて取得してdbに反映させる。
      username: user.displayName,
    });
    // コメントを追加した後はuseStateのcommentを初期化する。
    setComment("");
  };
  return (
    <div className={styles.post}>
      <div className={styles.post_avatar}>
        {/* srcにpropsで受けたavatar属性を割り当てる。 */}
        <Avatar src={props.avatar} />
      </div>
      <div className={styles.post_body}>
        <div>
          <div className={styles.post_header}>
            <h3>
              {/* propsで受け取ったusernameを渡す */}
              <span className={styles.post_headerUser}>@{props.username}</span>
              <span className={styles.post_headerTime}>
                {/* firebaseで取得したtimestampをJavaScriptのDate型として出力するために、
                toDateを使いJavaScriptのDate型に変換する必要がある。 */}
                {new Date(props.timestamp?.toDate()).toLocaleString()}
              </span>
            </h3>
          </div>
          {/* Tweetのtextの内容を表示する。 */}
          <div className={styles.post_tweet}>
            <p>{props.text}</p>
          </div>
        </div>
        {/* propsのimageオブジェクトが存在する時だけ、
        propsで受け取ったimageデータを出力するようにしている。 */}
        {props.image && (
          <div className={styles.post_tweetImage}>
            <img src={props.image} alt="tweet" />
          </div>
        )}
        {/* コメントを表示、非表示させるアイコンを作っていく。 */}
        <MessageIcon
          className={styles.post_commentIcon}
          // このアイコンがクリックされた時にsetOpenCommentsでopenCommentsの現在の値に対して
          // 反対のtrue,falseを返す様にして、ステートがtoggleする様にする。
          onClick={() => setOpenComments(!openComments)}
        />
        {/* 上記のopenCommentsのtrue,falseに応じてcommentsの内容と、
        入力フォームとボタンが丸ごと表示、非表示される様にする。
        フラグメントの全体に対して条件式を使う。
        openCommentsがtrueの時にフラグメントの内容を表示させる。 */}
        {openComments && (
          // 表示、非表示させたいもの（コメントの内容、コメントしたユーザーのアバター、コメント入力フォーム、ボタン）をフラグメントで囲う。
          <>
            {/* useEffectでcommentsに格納されたデータの内容を展開して、ブラウザに表示出来るようにしていく。
        useStateでdbの内容が格納されているcommentsの配列の内容をmapで1つ1つ展開していく。
        展開された要素をcom変数に入れている。 */}
            {comments.map((com) => (
              <div key={com.id} className={styles.post_comment}>
                {/* 各コメントに対してcomからコメントを投稿したユーザーのアバター画像を出力する。
            コメント用のアバター画像サイズに上記のclassesのsmallを適応させる。 */}
                <Avatar src={com.avatar} className={classes.small} />
                {/* そのコメントをしたユーザーの名前を出力。 */}
                <span className={styles.post_commentUser}>@{com.username}</span>
                {/* そのコメントの実際のテキストを出力。 */}
                <span className={styles.post_commentText}>@{com.text}</span>
                {/* コメントをしたtimestampを出力する。 */}
                <span className={styles.post_headerTime}>
                  {new Date(com.timestamp?.toDate()).toLocaleString()}
                </span>
              </div>
            ))}
            {/* コメントを入力するフォームと、送信ボタンを作る。
        onSubmit属性にnewComment関数を実行される様にする。 */}
            <form onSubmit={newComment}>
              <div className={styles.post_form}>
                <input
                  className={styles.post_input}
                  type="text"
                  placeholder="Type new comment..."
                  // valueにuseStateのcommentステートを割り当てる。
                  value={comment}
                  // onChangeでユーザーがタイピングする度にsetCommentを呼び出して、
                  // コメントの内容をユーザーが入力した値で更新していく。
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setComment(e.target.value)
                  }
                />
                <button
                  // disabledを使い、commentが空の時にボタンが無効化される様にする。
                  disabled={!comment}
                  // コメントの有無でボタンの色を変更させる。
                  className={
                    comment ? styles.post_button : styles.post_buttonDisable
                  }
                  type="submit"
                >
                  {/* SendIconが押された時に、submitが実行される様にしている。 */}
                  <SendIcon className={styles.post_sendIcon} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Post;
