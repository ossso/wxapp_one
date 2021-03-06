//app.js
const api = require('function/api');
const login = require('function/login');

const options = {
    // 开发者自定义操作
    libs: {
        api,
        login
    },
    globalData: {},
    onLaunch() {
        // 记录网络状态
        wx.getNetworkType({
            success: res => {
                this.globalData.networkType = res.networkType;
            }
        });
        wx.onNetworkStatusChange(res => {
            this.globalData.networkType = res.networkType;
        });
    },
    // 进入小程序验证一次
    onShow() {
        // 进入的时候就验证一次
        // 验证登录
        if (!this.globalData.isLogin) {
            login.check(err => {
                if (err) {
                    // 用户登录
                    login.login(err => {
                        if (!err) this.globalData.isLogin = true
                    })
                } else {
                    this.globalData.isLogin = true
                }
            });
        }
    },
    msg(content) {
        wx.showToast({
            title: content,
            icon: "none",
        });
        return this;
    },
    model(content) {
        wx.showModal({
            title: "提示",
            showCancel: false,
            content,
        });
        return this;
    },
}

App(options);

options.libs.api.appGlobalData = options.globalData;
