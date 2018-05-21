// pages/other/login.js
var app = getApp();
Page({
    data: {},
    authLogin(res) {
        if (res.detail && res.detail.errMsg === 'getUserInfo:ok') {
            this.activeLogin()
        } else {
            wx.showModal({
                content: "您没有授权我们获取信息"
            })
        }
    },
    activeLogin() {
        wx.showLoading({
            title: "登录中...",
            mask: true
        })
        app.libs.login.login(err => {
            wx.hideLoading()
            if (err) {
                wx.showModal({
                    content: err.msg
                })
            } else {
                app.globalData.isLogin = true
                if (typeof app.globalData.login_cb === 'function') {
                    app.globalData.login_cb()
                    delete app.globalData.login_cb
                } else {
                    wx.switchTab({
                        url: '/pages/home/index'
                    })
                }
            }
        })
    },
    goToHome() {
        wx.switchTab({
            url: '/pages/home/index'
        })
    },
})
