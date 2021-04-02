// redux - tool - kitを使ってユーザーの情報をグローバルステート化するために設定する。

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../app/store";

// TSでUSERと言うデータ型を作っておく。
// オブジェクト型でdisplayNameとphotoUrlの属性を持たせ、それぞれstring型にする。
interface USER {
  displayName: string;
  photoUrl: string;
}

export const userSlice = createSlice({
  name: "user",

  // initialState内に扱いたいステートの内容を定義していく。
  initialState: {
    // オブジェクトの形でログインしているユーザーのIDと、アバター画像をphotoUrl、
    // ユーザーネームのdisplayNameを空の文字列で定義する。
    user: { uid: "", photoUrl: "", displayName: "" },
  },
  reducers: {
    // loginのアクションは、stateとactionを受け取る。
    // loginをreactのコンポーネントからdispatchで呼び出す時に、
    // actionのpayloadの属性に引数でfirebaseから取得したユーザーの情報をactionのpayloadに
    // 渡してloginで受け取れるようにしておく。
    login: (state, action) => {
      // 上記で定義したuserのステートの内容をactionのpayload経由で受け取ったユーザーの情報で更新するようにしておく。
      // こうすることで、loginに成功した時にfirebaseから取得したユーザー情報をreact側のreduxのステートに反映させることが出来る。
      state.user = action.payload;
    },

    // logoutでは、ユーザー側の内容を初期化しておく。
    logout: (state) => {
      state.user = { uid: "", photoUrl: "", displayName: "" };
    },

    // Update用のアクションとして、updateUserProfile関数を作る。
    // PayloadActionで上記のUSERのデータ構造を持ったオブジェクトをReactのコンポーネントから、
    // dispatchする時に受け取る様にしておく。
    // PayloadActionに関して、データ型を指定したい場合は、<USER>（ジェネリックス）を使って、
    // USERのデータ型を指定する事ができる。
    updateUserProfile: (state, action: PayloadAction<USER>) => {
      // payloadの中のdisplayNameをreduxのユーザーステートのdisplayName属性に更新、
      // photoUrlも同じようにする。
      state.user.displayName = action.payload.displayName;
      state.user.photoUrl = action.payload.photoUrl;
    },
  },
});

// reactのコンポーネントで上記で作ったアクションを使用するために、exportしておく。
export const { login, logout, updateUserProfile } = userSlice.actions;

// reduxストアのユーザーステートをreactのコンポーネントから参照する時にselectUserを使って参照することが出来る、
// その時に指定する関数を定義する。
// ここでは、ユーザーのステートを単純に返す事をしている。
// state.userのuserはAppのstore.tsのconfigureStore内のreducers内の名前と一致している。
export const selectUser = (state: RootState) => state.user.user;

export default userSlice.reducer;
