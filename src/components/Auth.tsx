// ReactのuseStateを使うのでimportする。
import React, { useState } from "react";

// reduxのdispatchを使うため、useDispatchをimportする。
import { useDispatch } from "react-redux";

// userSliceのupdateUserProfileをimportする。
import { updateUserProfile } from "../features/userSlice";

// Auth.module.cssをstylesとしてimportしておく。
import styles from "./Auth.module.css";

// firebaseのauth, provider, storageの各機能を使うため、importしておく。
import { auth, provider, storage } from "../firebase";

// @material-ui/coreからimportしているものは、まとめておく。
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Paper,
  Grid,
  Typography,
  makeStyles,
  Modal,
  IconButton,
  Box,
} from "@material-ui/core";

// @material-ui/iconsをそれぞれ5つimportしておく。
import SendIcon from "@material-ui/icons/Send";
import CameraIcon from "@material-ui/icons/Camera";
import EmailIcon from "@material-ui/icons/Email";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import { url } from "node:inspector";
import classes from "./Auth.module.css";

// modalのレイアウトに基になる関数を定義する。
// マテリアルUIの公式ページから出ている関数getModalStyleを定義する。
function getModalStyle() {
  // 画面上のtopとleftから50の位置（画面の真ん中にくる）にmodalが出る様にする。;
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,

    // このままではmodalのカードの左上の角が画面の真ん中にくるので、カードが真ん中にくる様にする。
    // transformを使いカードの横と縦の長さの半分の長さだけ左と上に戻すと、カードが画面の真ん中に来る。
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
  },
  modal: {
    outline: "none",
    position: "absolute",
    width: 400,
    borderRadius: 10,
    backgroundColor: "white",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(10),
  },
  image: {
    // unsplashから好みの写真を選択し、urlの引数にimageAddressをコピペする。
    backgroundImage:
      "url(https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)",
    backgroundRepeat: "no-repeat",
    backgroundColor:
      theme.palette.type === "light"
        ? theme.palette.grey[50]
        : theme.palette.grey[900],
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const Auth: React.FC = () => {
  const classes = useStyles();

  // 上記でimportしたアクションを実行するためにdispatchが必要なため、
  // FCの中でuseDispatchを使い、dispatchを作る。
  const dispatch = useDispatch();

  // useStateを使いemailとpasswordを定義していく。
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // usernameのフォーマットでユーザーがタイピングしたusernameを格納するusernameと言うステートを作る。
  // useStateからusernameとsetUsernameを作る。
  const [username, setUsername] = useState("");

  // avatarImageの初期値を選択されていないので引数にnullを入力。
  // avatarImageが取り得るデータ型としては、nullまたは
  // javascriptで定義されているFileオブジェクト型のどちらかを取れる様に、
  // これをユニオンタイプ("|"のやつ)で指定しておく。
  const [avatarImage, setAvatarImage] = useState<File | null>(null);

  // loginモードとresisterモードを判別するために、
  // true/falseのステートを保持するisLginステートを定義する。
  // 初期状態をtrueにして最初はloginモードで表示されるように設定しておく。
  const [isLogin, setIsLogin] = useState(true);

  // useStateを使い、openModalと言うstateを定義する。
  // true, falseを使い制御する。初期値をfalseでModalが閉じている状態にする。
  const [openModal, setOpenModal] = React.useState(false);

  // ユーザーがModalの中で入力したリセット用のパスワードをの内容を保持するための、
  // resetEmailをuseStateを使い定義していく。
  const [resetEmail, setResetEmail] = useState("");

  // ユーザーがアイコンをクリックしたときに、ファイルを選択するためのダイアログが立ち上がるようにしていく。
  // ユーザーが何らかのファイルの選択をした時に、呼び出されるハンドラー関数を定義しておく。
  // onChangeImageHandler関数は、ダイアログからeventオブジェクトを通じて選択されたファイルのオブジェクトを取得する。
  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 選択した画像ファイルは1つだけにするため、filesの配列の０番目の要素の画像データだけを取得する。
    if (e.target.files![0]) {
      // 選択した画像ファイルが存在する場合は、
      // setAvatarImageでavatarImageに画像ファイルのオブジェクトを格納してステートを更新する。
      // "!"について、TSのNon-null assertion operatorの機能。
      // これはTSのコンパイラにe.target.files![0]はnullまたはundefinedでは無いと通知するもの。
      // 仮に"!"を削除すると、TSのコンパイラが"オブジェクトは 'null' である可能性があります。"とエラーを出す。
      // そして、これはindex0の要素にアクセス出来ないとエラーが出る。
      // onChangeImageHandlerに入る時は既に何らかのファイルが選択されている時のため、
      // この"!"Non-null assertion operatorをつけることで、コンパイラの方に
      // こちらはnullでは有りませんよと教えることで、エラーを解消している。
      setAvatarImage(e.target.files![0]);

      // 格納が終わればe.target.valueで毎度初期化しておく。
      // これはHTMLのファイルダイアログになる。
      // これは連続してファイルを選択した時に、onchangeが反応しない仕様になっている。
      // これを毎回反応する様にするためには、e.target.valueを毎回初期化する必要がある。
      e.target.value = "";
    }
  };

  // ModalでユーザーがEmailを送信する時に、送信ボタンをクリックした時に実行される関数を定義する。
  // クリックすると、そのEmail宛にfirebaseからパスワードリセット用のEmailが届く。
  // そのEmailに記載されているリンクをクリックすると、ブラウザが新しく立ち上がる。
  // そのブラウザに新しいパスワードを設定してsaveを押すとパスワードを更新することが出来る。
  const sendResetEmail = async (e: React.MouseEvent<HTMLElement>) => {
    // firebaseのauthモジュール機能に有るsendPasswordResetEmail機能を呼び出す。
    // 引数にリセットしたいEmailを渡す。
    await auth
      .sendPasswordResetEmail(resetEmail)

      // 渡すことに成功した場合はModalが閉じる様にする。
      .then(() => {
        setOpenModal(false);

        // その後にresetEmailのステートを空の文字列で初期化させる。
        setResetEmail("");
      })

      // 何らかのエラーを検知した場合はアラートのダイアログにエラーmessesを表示させるようにする。
      .catch((err) => {
        alert(err.message);
        setResetEmail("");
      });
  };
  const signInGoogle = async () => {
    // 非同期関数にするために、処理が終わるまでawaitで待つ様にしている。
    // firebaseのauthの機能でsignInWithPopupがある。これは、firebase.tsで作った
    // GoogleAuthProviderをproviderに格納したものを、ポップアップでGoogleのsigninを表示させる意味になる。
    // この認証時に何らかのエラーが発生した場合は、エラーメッセージをアラートで表示させる様にしている。
    await auth.signInWithPopup(provider).catch((err) => alert(err.message));
  };

  // ユーザーがアイコンをクリックしたときに、ファイルを選択するためのダイアログが立ち上がるようにしていく。
  // ユーザーが何らかのファイルの選択をした時に、呼び出されるハンドラー関数を定義しておく。
  // onChangeImageHandler関数は、ダイアログからeventオブジェクトを通じて選択されたファイルのオブジェクトを取得する。

  // emailとpasswordでログイン出来る様にsignInEmail関数を作る。
  const signInEmail = async () => {
    // firebaseのauthモジュールの機能でsignInWithEmailAndPasswordがある。
    // この引数としてuseStateで管理しているemailとpasswordを渡す。
    await auth.signInWithEmailAndPassword(email, password);
  };

  // resiseterで新規にユーザーを作るときに呼び出されるsignUpEmail関数を作る。

  const signUpEmail = async () => {
    // auth.createUserWithEmailAndPassword関数は返り値として、
    // この時に作られたユーザーのオブジェクトを返してくれる。それをconstで受け取る様にする。
    const authUser = await auth.createUserWithEmailAndPassword(email, password);

    // firebaseのcloudstrageにアップロードしたアバターの画像を保存していく。
    // その保存された画像データがどこにあるか識別するためのURLを格納する変数urlを作る。
    // 初期値は空の文字列にする。
    let url = "";

    // avatarImageが存在する場合は、cloudのfirestorageにデータを格納していく。
    if (avatarImage) {
      // 下記で使うfileNameを作っていく。
      // firebaseの仕様で同じfileNameの画像を複数回UPロードしていくと、もともと有ったファイルが削除されてしまう。
      // それを防ぐためにfileNameを自動でランダムなfileNameを作っていく。
      // Sはランダムな文字列の候補となる。
      // アルファベットの小文字と大文字、数字を全部合わせて62文字並べる。
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
      const fileName = randomChar + "_" + avatarImage.name;

      // firestorageに格納していくために、storageの中のrefを使う。
      // refはフォルダの階層を指定することが出来る。
      // avatarsと言うフォルダを作り、そこに画像ファイルをどんどん格納していく。
      // そのフォルダの中に画像データのファイルネームを指定して保存していく。
      // putの引数にファイルデータの実態（avatarImageのステートに入っている）を指定することで、
      // firestorageに画像ファイルをアップロードすることが出来る。
      await storage.ref(`avatars/${fileName}`).put(avatarImage);

      // その後に画像データがcloud上のどこにあるかと言うのをurlで取得する必要が有る。
      // storageのrefのavatarsのフォルダの中から格納したファイルネームのオブジェクトを取得してきて、
      // getDownloadURLを実行することで、アップロードしたファイルのURLを取得することが出来る。
      url = await storage.ref("avatars").child(fileName).getDownloadURL();
    }

    // firebaseのユーザーが持っているdisplayNameと、photoURLを更新する。こうすることで、
    // emailpasswordで新規で作ったユーザーのfirebaseのユーザー情報に追加した状態でユーザーを作ることが出来る。
    // authUserのuser属性が存在する場合、firebaseのupdateProfile機能を使い、
    // displayNameとphotoURLを更新していく。
    await authUser.user?.updateProfile({
      // displayNameはユーザーがusernameのフィールドで入力したステートを
      displayName: username,

      // photoURLはユーザーがstrageに格納したavatar画像のurlのパス（180行目）を代入ていく。
      photoURL: url,
    });

    // 上記でfirebaseのdisplayNameと、photoURLを更新したら、
    // reduxのusersステートでも即座にdisplayNameとphotoUrlをreduxにアップロードする。
    // dispatchを使ってupdateUserProfileを実行する。
    // この時actionpayloadでfirebaseのユーザーデータをreduxのユーザーステートに渡して行く。
    dispatch(
      updateUserProfile({
        displayName: username,
        photoUrl: url,
      })
    );
  };

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {/* isLoginがtrueの時はLoginの表記が出る様にして、falseの時はResisterが出る様にする。 */}
            {isLogin ? "Login" : "Register"}
          </Typography>
          <form className={classes.form} noValidate>
            {/* usernameとavatar画像のアップロードはresisterモードの時のみ表示させる。
!isLoginがtrueの時(resisterモーdの時)は表示されるように条件式を作る。 */}
            {!isLogin && (
              <>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  // useステートで定義したusernameのステートをvalueに割り当てる。
                  value={username}
                  // ユーザーがタイピングでステートを変更した際に毎回呼び出されるコールバックとして、
                  // onChangeにeventオブジェクトを使ってsetUsernameを毎回呼び出す。
                  // これでユーザーがタイピングした内容をその都度useStateのステートに反映させる様にしておく。
                  // このeventオブジェクトにデータ型をつけておく。
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setUsername(e.target.value);
                  }}
                />
                {/* avatar画像を追加できる、アイコンを作成する。 */}
                <Box textAlign="center">
                  <IconButton>
                    {/* inputフィールドとアイコンをラベルで囲う事で、アイコンをクリックした時に
                    inputファイルのダイアログが起動する様になる。 */}
                    <label>
                      {/* マテリアルUIのアイコンからAccountCircleIconを取ってくる。 */}
                      <AccountCircleIcon
                        fontSize="large"
                        className={
                          // avatarImageが存在する場合としない場合で条件分けをする。
                          // 画像をユーザーが選択した後に既に選択しているとユーザーに知らせるために、アイコンの色を変える。
                          avatarImage
                            ? styles.login_addIconLoaded
                            : styles.login_addIcon
                        }
                      />
                      <input
                        className={styles.login_hiddenIcon}
                        // ユーザーがfileを選択した時に上記で定義したonChangeImageHandler関数が毎回呼ばれる。
                        type="file"
                        onChange={onChangeImageHandler}
                      />
                    </label>
                  </IconButton>
                </Box>
              </>
            )}
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              // emailのステートをvalueに割り当てる。
              value={email}
              // ユーザーがタイピングでステートを変更した際に毎回呼び出されるコールバックとして、
              // onChangeにeventオブジェクトを使ってsetEmailを毎回呼び出す。
              // これでユーザーがタイピングした内容をその都度useStateのステートに反映させる様にしておく。
              // このeventオブジェクトにデータ型をつけておく。
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPassword(e.target.value);
              }}
            />

            <Button
              // firebaseの仕様でpasswordが6文字以上入力が必要。それが無い場合にボタンを無効化するようにしていく。
              // disabled属性を足す。ログインモードと、レジスターモードで条件分けをして、
              // それぞれの右辺の値がtrueになればボタンが無効化される。
              disabled={
                // emailの値が無い場合か、passwordが6文字未満の場合。
                // username,email,avatarImageがどれか1つでも無い場合、passwordが6文字未満の場合。
                isLogin
                  ? !email || password.length < 6
                  : !username || !email || password.length < 6 || !avatarImage
              }
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              // startIcon属性でEmailIconを足すと、メールのアイコンが付与される。
              startIcon={<EmailIcon />}
              // ログインモードとレジスターモードで条件分岐をする。
              onClick={
                // ログインモードで入ってきた時は、signInEmailを実行する様に出来ている。
                isLogin
                  ? async () => {
                      try {
                        await signInEmail();

                        // 何らかのエラーが発生した場合は、アラートのダイアログで表示する様にしている。
                      } catch (err) {
                        alert(err.message);
                      }
                    }
                  : async () => {
                      try {
                        // レジスターモードで入ってきた時は、signUpEmailを実行する様に出来ている。
                        await signUpEmail();
                      } catch (err) {
                        alert(err.message);
                      }
                    }
              }
            >
              {isLogin ? "Login" : "Register"}
            </Button>

            <Grid container>
              {/* xsはtrueと同じ意味になる。これが複数あると、等間隔で並ぶ。 Forgot
              password?とCreate new account ?を両端に寄せる場合、
              初めのitemにxs(true)を利かせ、2個目は無しにして利かせない様にすると、
              1つ目が全体を占め、もう1つが端に寄せられる。 */}
              <Grid item xs>
                {/* パスワードリセット用のリンク */}
                <span
                  className={styles.login_reset}
                  // クリックされた時にsetOpenModalがtrueになる様にして、Modalが開くようにする。
                  onClick={() => setOpenModal(true)}
                >
                  Forgot password ?
                </span>
              </Grid>
              <Grid item>
                {/* ログインしている場合は、resisterモードにしますか？と表記、
                ログインしていなければ、ログインモードに戻りますか？と表記する。
                また、Create new account ?とBack to loginが押されるたびに、
                isLoginのステートをトグルしてtrue or falseを反転させる。
                （onClickでテキストが押される度にsetIsLoginが呼び出され、現在のisLoginの反対側の値に反転してくれる。） */}
                <span
                  className={styles.login_toggleMode}
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Create new account ?" : "Back to login"}
                </span>
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant="contained"
              color="default"
              className={classes.submit}
              startIcon={<CameraIcon />}
              // onClickで上記で定義したsignInGoogle関数を実行する。
              onClick={signInGoogle}
            >
              SignIn with Google
            </Button>
          </form>

          {/* Modalのコンポーネントはopen属性を持ち、trueかfalseに応じてModalが閉じたり開いたりする。
onClose属性(onCloseはModal以外の領域をクリックした時に実行されるもの。)では、falseにしてModalを閉じている。 */}
          <Modal open={openModal} onClose={() => setOpenModal(false)}>
            {/* styleはgetModalStyleを実行して、styleを適用している。 */}
            <div style={getModalStyle()} className={classes.modal}>
              <div className={styles.login_modal}>
                {/* TextFieldでユーザーがreset用のEmailを入力出来るようにしている。 */}
                <TextField
                  InputLabelProps={{
                    shrink: true,
                  }}
                  type="email"
                  name="email"
                  label="Reset E-mail"
                  // valueにsuseStateで定義したresetEmailを割り当てる。
                  value={resetEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // setResetEmailでユーザーが入力した内容を随時更新している。
                    setResetEmail(e.target.value);
                  }}
                />

                {/* SendIconが押された時にsendResetEmailが実行される様にしている。 */}
                <IconButton onClick={sendResetEmail}>
                  <SendIcon />
                </IconButton>
              </div>
            </div>
          </Modal>
        </div>
      </Grid>
    </Grid>
  );
};
export default Auth;
