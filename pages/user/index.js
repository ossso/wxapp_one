//获取应用实例
const app = getApp()
const config = require("../../config/index")
Page({
    data: {
        name: config.name
    },
    onShow() {
        if (app.globalData.isLogin) {
            this.loadInfo()
        } else {
            app.globalData.login_cb = function() {
                wx.switchTab({
                    url: '/pages/user/index'
                })
            }
            wx.redirectTo({
                url: '/pages/user/login'
            })
        }
    },
    /**
     * 下拉刷新
     */
    onPullDownRefresh() {
        this.loadData(() => {
            app.msg("刷新成功")
            wx.stopPullDownRefresh()
        })
    },
    /**
     * 加载信息
     */
    loadInfo() {
        var userinfo = wx.getStorageSync('userinfo')
        if (userinfo) {
            this.setData({userinfo})
        } else {
            this.loadData()
        }
    },
    /**
     * 加载用户信息
     */
    loadData(cb) {
        app.libs.api.req('user', {}, (err, res) => {
            if (err) {
                app.model(err.msg)
            } else {
                wx.setStorage({
                    key: 'userinfo',
                    data: res
                })
                this.setData({userinfo: res})
            }
            cb && cb()
        })
    },
    /**
     * 跳转至绑定页面
     */
    bindUser() {
        wx.navigateTo({
            url: "/pages/user/bind"
        })
    },
    /**
     * 解除绑定
     */
    unBindUser() {
        function cancel() {
            wx.showLoading({
                title: "正在解绑..."
            })
            app.libs.api.req('unbind', {}, (err,res) => {
                wx.hideLoading()
                if (err) {
                    app.msg(err.msg)
                } else {
                    app.msg("已解除绑定")
                    this.loadData()
                }
            })
        }
        wx.showModal({
            title: "提示",
            content: "您确定要解除绑定吗?",
            success: res => {
                if (res.confirm) {
                    cancel.call(this)
                }
            }
        })
    },
    // 退出登录
    logout() {
        app.globalData.isLogin = false
        wx.removeStorage({
            key: 'userinfo'
        })
        wx.removeStorage({
            key: 'sessionid'
        })
        wx.reLaunch({
            url: '/pages/home/index'
        })
    }
})
