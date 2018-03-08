// pages/other/login.js
var app = getApp();
Page({
    data: {},
    activLogin() {
        wx.showLoading({
            title: "登录中...",
            mask: true
        })
        app.libs.login.login(err => {
            wx.hideLoading()
            if (err && (err.code == 200000 || err.code == 200001)) {
                wx.showModal({
                    title: '无法快速授权',
                    content: '您需要打开授权设置页面，授权我们获取您公开信息。',
                    confirmText: '打开设置',
                    success: res => {
                        if (res.confirm) {
                            wx.openSetting({
                                success: res => {
                                    if (res.authSetting['scope.userInfo']) {
                                        this.activLogin()
                                    }
                                }
                            })
                        }
                    }
                })
            } else if (err != null) {
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
