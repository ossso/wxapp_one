// pages/other/bind.js
var app = getApp()
const config = require("../../config/index")
const md5 = require("../../utils/md5")
Page({
    data: {
        name: config.name,
        username: '',
        password: ''
    },
    status: {},
    // 处理输入框内容
    bindInputChange(e) {
        var data = e.currentTarget.dataset
        var updateData = {}
        updateData[data['name']] = e.detail.value
        this.setData(updateData)
    },
    /**
     * 验证
     */
    verify() {
        this.status.verify = true
        if (!this.data.username.length) {
            app.msg('请输入您的账号')
            this.status.verify = false
            return this
        } else if (!this.data.password.length) {
            app.msg('请输入您的密码')
            this.status.verify = false
            return this
        }
        return this
    },
    /**
     * 提交绑定
     */
    submit() {
        if (this.status.submit) return this
        this.verify()
        if (!this.status.verify) return this
        wx.showLoading({
            title: "验证中..."
        })
        this.status.submit = true
        app.libs.api.req('bind', {
            username: this.data.username,
            password: md5(this.data.password),
        }, (err, res) => {
            wx.hideLoading()
            if (err) {
                app.model(err.msg)
            } else {
                wx.showToast({
                    title: "绑定成功",
                    icon: "success",
                    mask: true
                })
                setTimeout(() => {
                    wx.switchTab({
                        url: '/pages/user/index'
                    })
                }, 1000)
            }
        })
    }
})
