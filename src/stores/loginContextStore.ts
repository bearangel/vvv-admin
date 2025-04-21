import { defineStore } from "pinia";
import { LoginContext } from "@/models/loginContext";

export const loginContextStore = defineStore("loginContent", {
  state: (): { loginContext: LoginContext | null } => ({
    loginContext: null
  }),
  persist: {
    storage: sessionStorage
  },
  actions: {
    /**
     * 设置登录上下文
     * @param context 登录上下文对象 {@link LoginContext}
     */
    setLoginContext(context: LoginContext) {
      this.loginContext = context;
    },
    /**
     * 情况上下文
     */
    clearLoginContext() {
      this.loginContext = null;
    },
  },
});
