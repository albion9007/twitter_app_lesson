// useStateとuseEffectを使うため、reactからimportしておく。
import React, { useState, useEffect } from "react";
import styles from "./Feed.module.css";
import { db } from "../firebase";
import TweetInput from "./TweetInput";
import Post from "./Post";

// FeedコンポーネントからcroudのFirestoreの投稿データにアクセスして、データを取得する。
// Feedコンポーネントがマウントされた時に、useEffectの内容が実行される。
// そしてdbのfirestoreから投稿のデータを取得して、
// その値をsetPostsを使ってreactのpostsステートに格納することが出来る。
// FeedコンポーネントにReactのFCの型をつける。
const Feed: React.FC = () => {
  // 投稿のオブジェクトを格納するためのpostsと言うステートを作っていく。;
  // useStateを配列で定義していく。
  const [posts, setPosts] = useState([
    {
      // 各要素はdbの構造にidを加えた属性を持たせる。
      // 各要素を空の文字列で初期化させる。
      id: "",
      avatar: "",
      image: "",
      text: "",
      // timestampだけnullで初期化する。
      timestamp: null,
      username: "",
    },
  ]);

  // hooksのuseEffectを使いデータを取得していく処理を作る。
  useEffect(() => {
    // collectionの返り値として、unSubスクリプション関数が有る。
    const unSub = db
      // データベースのcollectionの名前にデータが入っているpostsを指定する。
      .collection("posts")
      // データの並び順をtimestampの降順に指定する。これで１番新しい投稿が１番上に来るようになる。
      .orderBy("timestamp", "desc")
      // onSnapshotを使うことで、firebaseに何らかのデータが有るたびに毎回setPostsの処理が行われる。
      .onSnapshot((snapshot) =>
        // snapshotのdocsでpostsの中に有るdocumentを全て取得することが出来る。mapでそれらを展開する。
        // setPostsを使って上記でpostsステートの中に配列の形で要素を格納する。
        setPosts(
          // 各パラメータはdocの形を辿って、それぞれ代入していく。
          snapshot.docs.map((doc) => ({
            // idはdoc.idだけでidを取得出来る。
            id: doc.id,
            // 他パラメータはdoc.data()で属性にアクセスすることが出来る。
            avatar: doc.data().avatar,
            image: doc.data().image,
            text: doc.data().text,
            timestamp: doc.data().timestamp,
            username: doc.data().username,
          }))
        )
      );
    return () => {
      // このコンポーネントがアンマウントされる時に実行されるcleanUp関数に上記のunSub関数を実行する。
      unSub();
    };
    // 第2引数を空の[]にしている。これでFeedコンポーネントがマウントされた時に、
    // 最初の1回だけ実行される処理になる。
  }, []);

  return (
    <div className={styles.feed}>
      <TweetInput />
      {/* 条件式を使い、投稿が０の時には、レンダリングしない様にしていく。
      postsのidが存在する時は、レンダリングする様にする。 */}
      {posts[0]?.id && (
        <>
          {posts.map((post) => (
            // firebaseで取得した属性をpropsを使ってPostコンポーネントで渡していく。
            <Post
              key={post.id}
              postId={post.id}
              avatar={post.avatar}
              image={post.image}
              text={post.text}
              timestamp={post.timestamp}
              username={post.username}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Feed;
